/**
 * convexForm() — client-side form that matches SvelteKit's RemoteForm API
 * but calls Convex mutations directly (no server hop).
 *
 * Uses `createAttachmentKey` from svelte/attachments for the spread mechanism,
 * exactly how SvelteKit's own form() works.
 *
 * Usage:
 * ```svelte
 * <script>
 *   const createTask = convexForm(z.object({ text: z.string() }), api.tasks.create)
 * </script>
 * <form {...createTask}>
 *   <input {...createTask.fields.text.as("text")} />
 *   <button disabled={!!createTask.pending}>Create</button>
 * </form>
 * ```
 */
import type { FunctionReference, FunctionArgs, FunctionReturnType } from "convex/server"
import { createAttachmentKey } from "svelte/attachments"

// Minimal Standard Schema V1 interface (avoids @standard-schema/spec dependency)
interface SchemaIssue {
  message: string
  path?: readonly unknown[]
}

interface SchemaResult {
  issues?: readonly SchemaIssue[]
}

interface StandardSchema<Input = unknown> {
  "~standard": {
    types?: { input: Input; output: unknown }
    validate(value: unknown): Promise<SchemaResult | undefined> | SchemaResult | undefined
  }
}
import { tick } from "svelte"
import { getConvexClient } from "./client.svelte.js"
import { SvelteMap } from "svelte/reactivity"

// ============================================================================
// Types
// ============================================================================

interface FormIssue {
  message: string
  path: Array<string | number>
  name: string
  server: boolean
}

/** Matches SvelteKit's RemoteForm API surface */
export interface ConvexForm<
  Input extends Record<string, unknown>,
  Output = FunctionReturnType<FunctionReference<"mutation">>,
> {
  /** Spread onto <form> to attach submit handler */
  [key: symbol]: (node: HTMLFormElement) => void
  method: "POST"

  /** Form fields proxy — .fields.name.as("text"), .fields.name.issues() */
  readonly fields: ConvexFormFields<Input>
  /** Last mutation result */
  readonly result: Output | undefined
  /** Number of in-flight mutations */
  readonly pending: number

  /** Attach a Zod/Standard schema for client-side preflight validation */
  preflight(schema: StandardSchema<Input>): ConvexForm<Input, Output>
  /** Validate form contents programmatically */
  validate(options?: { includeUntouched?: boolean; preflightOnly?: boolean }): Promise<void>
  /** Customize the submit lifecycle */
  enhance(
    callback: (opts: {
      form: HTMLFormElement
      data: Input
      submit: () => Promise<Output>
    }) => void | Promise<void>,
  ): { method: "POST"; [key: symbol]: (node: HTMLFormElement) => void }
  /** Create a parameterized form instance (for lists) */
  for(id: string | number): Omit<ConvexForm<Input, Output>, "for">
}

/**
 * Form fields type matching SvelteKit's RemoteFormFields.
 * At runtime, backed by Proxy — any property access returns a ConvexFormField.
 * Known keys from schema are typed precisely; unknown keys fall through.
 */
type ConvexFormFields<T> = {
  // Known fields from schema — required, no `undefined`
  [K in keyof T]-?: ConvexFormField<T[K]>
} & ConvexFormFieldContainer

interface ConvexFormFieldContainer {
  allIssues(): Array<{ message: string; path: Array<string | number> }> | undefined
}

interface ConvexFormField<_T = unknown> extends ConvexFormFieldContainer {
  as(type: string, value?: string): Record<string, unknown>
  issues(): Array<{ message: string; path: Array<string | number> }> | undefined
  value(): _T
  set(value: _T): _T
}

// ============================================================================
// Form utilities (adapted from SvelteKit's form-utils.js)
// ============================================================================

function convertFormData(data: FormData): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (let key of data.keys()) {
    const isArray = key.endsWith("[]")
    let values: FormDataEntryValue[] = data.getAll(key)
    if (isArray) key = key.slice(0, -2)

    values = values.filter(
      (entry) =>
        typeof entry === "string" || (entry as File).name !== "" || (entry as File).size > 0,
    )

    if (key.startsWith("n:")) {
      key = key.slice(2)
      values = values.map((v) =>
        v === "" ? undefined : parseFloat(v as string),
      ) as unknown as FormDataEntryValue[]
    } else if (key.startsWith("b:")) {
      key = key.slice(2)
      values = values.map((v) => v === "on") as unknown as FormDataEntryValue[]
    }

    deepSet(result, key.split(/\.|\[|\]/).filter(Boolean), isArray ? values : values[0])
  }
  return result
}

function deepSet(obj: Record<string, unknown>, keys: string[], value: unknown) {
  let current: Record<string, unknown> = obj
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]!
    const isArrayNext = /^\d+$/.test(keys[i + 1] ?? "")
    if (!Object.hasOwn(current, key)) {
      ;(current as Record<string, unknown>)[key] = isArrayNext ? [] : {}
    }
    current = current[key] as Record<string, unknown>
  }
  const finalKey = keys[keys.length - 1]!
  ;(current as Record<string, unknown>)[finalKey] = value
}

function deepGet(obj: Record<string, unknown>, path: (string | number)[]): unknown {
  let current: unknown = obj
  for (const key of path) {
    if (current == null || typeof current !== "object") return current
    current = (current as Record<string | number, unknown>)[key]
  }
  return current
}

function flattenIssues(issues: FormIssue[]): Record<string, FormIssue[]> {
  const result: Record<string, FormIssue[]> = {}
  for (const issue of issues) {
    ;(result.$ ??= []).push(issue)
    let name = ""
    if (issue.path) {
      for (const key of issue.path) {
        name += typeof key === "number" ? `[${key}]` : name === "" ? key : `.${key}`
        ;(result[name] ??= []).push(issue)
      }
    }
  }
  return result
}

function buildPathString(path: (string | number)[]): string {
  let result = ""
  for (const segment of path) {
    result += typeof segment === "number" ? `[${segment}]` : result === "" ? segment : `.${segment}`
  }
  return result
}

function normalizeIssue(issue: { message: string; path?: readonly unknown[] }): FormIssue {
  const normalized: FormIssue = { name: "", path: [], message: issue.message, server: false }
  if (issue.path) {
    let name = ""
    for (const segment of issue.path) {
      const key = typeof segment === "object" ? (segment as { key: string | number }).key : segment
      normalized.path.push(key as string | number)
      name += typeof key === "number" ? `[${key}]` : name === "" ? key : `.${key}`
    }
    normalized.name = name
  }
  return normalized
}

// ============================================================================
// Field proxy (adapted from SvelteKit's create_field_proxy)
// ============================================================================

function createFieldProxy(
  target: unknown,
  getInput: () => Record<string, unknown>,
  setInput: (path: (string | number)[], value: unknown) => void,
  getIssues: () => Record<string, FormIssue[]>,
  path: (string | number)[] = [],
): unknown {
  const getValue = () => deepGet(getInput(), path)

  return new Proxy(target as object, {
    get(_target, prop) {
      if (typeof prop === "symbol") return (target as Record<symbol, unknown>)[prop]
      if (/^\d+$/.test(prop as string)) {
        return createFieldProxy({}, getInput, setInput, getIssues, [
          ...path,
          parseInt(prop as string, 10),
        ])
      }

      const key = buildPathString(path)

      if (prop === "set") {
        const setFn = (newValue: unknown) => {
          setInput(path, newValue)
          return newValue
        }
        return createFieldProxy(setFn, getInput, setInput, getIssues, [...path, prop])
      }
      if (prop === "value") {
        return createFieldProxy(getValue, getInput, setInput, getIssues, [...path, prop])
      }
      if (prop === "issues" || prop === "allIssues") {
        const issuesFn = () => {
          const allIssues = getIssues()[key === "" ? "$" : key]
          if (prop === "allIssues") {
            return allIssues?.map((i) => ({ path: i.path, message: i.message }))
          }
          return allIssues
            ?.filter((i) => i.name === key)
            ?.map((i) => ({ path: i.path, message: i.message }))
        }
        return createFieldProxy(issuesFn, getInput, setInput, getIssues, [...path, prop])
      }
      if (prop === "as") {
        const asFn = (type: string, inputValue?: string) => {
          const isArray =
            type === "file multiple" ||
            type === "select multiple" ||
            (type === "checkbox" && typeof inputValue === "string")
          const prefix =
            type === "number" || type === "range"
              ? "n:"
              : type === "checkbox" && !isArray
                ? "b:"
                : ""

          const baseProps: Record<string, unknown> = {
            name: prefix + key + (isArray ? "[]" : ""),
            get "aria-invalid"() {
              return key in getIssues() ? "true" : undefined
            },
          }

          if (type !== "text" && type !== "select" && type !== "select multiple") {
            baseProps.type = type === "file multiple" ? "file" : type
          }

          if (type === "submit" || type === "hidden") {
            return Object.defineProperties(baseProps, {
              value: { value: inputValue, enumerable: true },
            })
          }

          if (type === "select" || type === "select multiple") {
            return Object.defineProperties(baseProps, {
              multiple: { value: isArray, enumerable: true },
              value: { enumerable: true, get: () => getValue() },
            })
          }

          if (type === "checkbox" || type === "radio") {
            return Object.defineProperties(baseProps, {
              value: { value: inputValue ?? "on", enumerable: true },
              checked: {
                enumerable: true,
                get() {
                  const value = getValue()
                  if (type === "radio") return value === inputValue
                  if (isArray) return ((value as string[]) ?? []).includes(inputValue!)
                  return value
                },
              },
            })
          }

          // text, email, password, number, etc.
          return Object.defineProperties(baseProps, {
            value: {
              enumerable: true,
              get() {
                const value = getValue()
                return value != null ? String(value) : ""
              },
            },
          })
        }
        return createFieldProxy(asFn, getInput, setInput, getIssues, [...path, "as"])
      }

      // Nested field access
      return createFieldProxy({}, getInput, setInput, getIssues, [...path, prop])
    },
  })
}

// ============================================================================
// convexForm — main export
// ============================================================================

/**
 * Create a client-side form that calls a Convex mutation directly.
 * API matches SvelteKit's RemoteForm for maximum DX compatibility.
 *
 * @param schema — Zod or Standard Schema for client-side validation
 * @param mutationRef — Convex mutation FunctionReference (e.g. api.tasks.create)
 * @param mapArgs — Optional transform from form data to mutation args (identity by default)
 */
/** Extract the input type from a Standard Schema */
type InferInput<S> = S extends StandardSchema<infer I> ? I : Record<string, unknown>

export function convexForm<
  Schema extends StandardSchema<Record<string, unknown>>,
  Mutation extends FunctionReference<"mutation"> = FunctionReference<"mutation">,
  Input extends Record<string, unknown> = InferInput<Schema> & Record<string, unknown>,
>(
  schema: Schema,
  mutationRef: Mutation,
  mapArgs?: (data: Input) => FunctionArgs<Mutation>,
): ConvexForm<Input, FunctionReturnType<Mutation>> {
  type Output = FunctionReturnType<Mutation>

  const instances = new SvelteMap<
    string | number | undefined,
    { count: number; instance: ConvexForm<Input, Output> }
  >()

  function createInstance(key?: string | number): ConvexForm<Input, Output> {
    let input: Record<string, unknown> = $state({})
    let rawIssues: FormIssue[] = $state.raw([])
    const issues = $derived(flattenIssues(rawIssues))
    let result: Output | undefined = $state.raw(undefined)
    let pendingCount: number = $state(0)
    let preflightSchema: StandardSchema | undefined = schema
    let element: HTMLFormElement | null = null
    let touched: Record<string, boolean> = {}
    let submitted = false

    function convert(formData: FormData): Record<string, unknown> {
      const data = convertFormData(formData)
      if (key !== undefined && !formData.has("id")) {
        data.id = key
      }
      return data
    }

    async function handleSubmit(
      form: HTMLFormElement,
      formData: FormData,
      callback: (opts: {
        form: HTMLFormElement
        data: Input
        submit: () => Promise<Output>
      }) => void | Promise<void>,
    ) {
      const data = convert(formData) as Input
      submitted = true

      // Client-side validation
      const validated = await preflightSchema?.["~standard"].validate(data)
      if (validated?.issues) {
        rawIssues = validated.issues.map((i) => normalizeIssue(i))
        return
      }

      try {
        await callback({
          form,
          data,
          submit: () => doMutation(data),
        })
      } catch (e) {
        console.error("[convexForm] submit error:", e)
      }
    }

    async function doMutation(data: Input): Promise<Output> {
      pendingCount++
      try {
        const client = getConvexClient()
        const args = mapArgs ? mapArgs(data) : (data as unknown as FunctionArgs<Mutation>)
        const mutationResult = (await client.mutation(mutationRef, args)) as Output
        result = mutationResult
        rawIssues = []
        return mutationResult
      } catch (e) {
        result = undefined
        throw e
      } finally {
        pendingCount--
      }
    }

    // Build the form submit handler
    function formOnSubmit(
      callback: (opts: {
        form: HTMLFormElement
        data: Input
        submit: () => Promise<Output>
      }) => void | Promise<void>,
    ) {
      return async (event: SubmitEvent) => {
        const form = event.target as HTMLFormElement
        event.preventDefault()
        const formData = new FormData(form, event.submitter)
        await handleSubmit(form, formData, callback)
      }
    }

    // Attachment: hooks into the <form> element lifecycle when spread
    function createAttachment(
      onsubmit: (event: SubmitEvent) => void,
    ): (form: HTMLFormElement) => (() => void) | void {
      return (form: HTMLFormElement) => {
        if (element) {
          throw new Error(
            "[convexForm] A form object can only be attached to a single <form> element. Use .for(key) for lists.",
          )
        }
        element = form
        touched = {}

        form.addEventListener("submit", onsubmit)

        // Track input changes for touched state
        form.addEventListener("input", (e) => {
          const el = e.target as HTMLInputElement
          let name = el.name
          if (!name) return
          if (name.endsWith("[]")) name = name.slice(0, -2)
          touched[name.replace(/^[nb]:/, "")] = true

          // Update input state
          const isArray = el.name.endsWith("[]")
          const isFile = el.type === "file"

          if (isArray) {
            const elements = Array.from(
              form.querySelectorAll(`[name="${el.name}"]`),
            ) as HTMLInputElement[]
            const value = isFile
              ? elements.map((inp) => Array.from(inp.files ?? [])).flat()
              : elements.map((inp) => inp.value)
            deepSet(
              input,
              name
                .replace(/^[nb]:/, "")
                .split(/\.|\[|\]/)
                .filter(Boolean),
              value,
            )
          } else if (isFile) {
            const file = (el as HTMLInputElement & { files: FileList }).files[0]
            if (file)
              deepSet(
                input,
                name
                  .replace(/^[nb]:/, "")
                  .split(/\.|\[|\]/)
                  .filter(Boolean),
                file,
              )
          } else {
            const cleanName = name.replace(/^[nb]:/, "")
            const rawValue = name.startsWith("n:")
              ? el.value === ""
                ? undefined
                : parseFloat(el.value)
              : name.startsWith("b:")
                ? el.type === "checkbox"
                  ? el.checked
                  : el.value === "on"
                : el.type === "checkbox"
                  ? el.checked
                  : el.value
            deepSet(input, cleanName.split(/\.|\[|\]/).filter(Boolean), rawValue)
          }
        })

        form.addEventListener("reset", async () => {
          await tick()
          input = convertFormData(new FormData(form))
        })

        return () => {
          element = null
          preflightSchema = undefined
        }
      }
    }

    // --- Build instance ---
    const instance = {} as ConvexForm<Input, Output>

    // Default attachment: submit → mutation → reset on success
    const defaultAttachment = createAttachment(
      formOnSubmit(async ({ submit, form }) => {
        await submit()
        if (!issues.$) form.reset()
      }),
    )

    Object.assign(instance, {
      method: "POST" as const,
      [createAttachmentKey()]: defaultAttachment,
    })

    Object.defineProperties(instance, {
      fields: {
        get: () =>
          createFieldProxy(
            {},
            () => input,
            (path, value) => {
              if (path.length === 0) {
                input = value as Record<string, unknown>
              } else {
                deepSet(input, path.map(String), value)
                touched[buildPathString(path)] = true
              }
            },
            () => issues,
          ),
      },
      result: { get: () => result },
      pending: { get: () => pendingCount },
      preflight: {
        value: (s: StandardSchema<Input>) => {
          preflightSchema = s
          return instance
        },
      },
      validate: {
        value: async ({ includeUntouched = false, preflightOnly: _ = false } = {}) => {
          if (!element) return
          await tick()
          const formData = new FormData(element)
          const data = convert(formData)
          const validated = await preflightSchema?.["~standard"].validate(data)
          if (validated?.issues) {
            let arr = validated.issues.map((i) => normalizeIssue(i))
            if (!includeUntouched && !submitted) {
              arr = arr.filter((i) => touched[i.name])
            }
            rawIssues = arr
          } else {
            rawIssues = []
          }
        },
      },
      enhance: {
        value: (
          callback: (opts: {
            form: HTMLFormElement
            data: Input
            submit: () => Promise<Output>
          }) => void | Promise<void>,
        ) => ({
          method: "POST" as const,
          [createAttachmentKey()]: createAttachment(formOnSubmit(callback)),
        }),
      },
    })

    return instance
  }

  const instance = createInstance()

  Object.defineProperty(instance, "for", {
    value: (id: string | number) => {
      const existing = instances.get(id)
      if (existing) {
        existing.count++
        return existing.instance
      }
      const entry = { count: 1, instance: createInstance(id) }
      instances.set(id, entry)

      try {
        $effect.pre(() => {
          return () => {
            entry.count--
            void tick().then(() => {
              if (entry.count === 0) instances.delete(id)
            })
          }
        })
      } catch {
        // Not in effect context
      }

      return entry.instance
    },
  })

  return instance
}
