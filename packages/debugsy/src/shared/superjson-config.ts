import superjson from "superjson";

/**
 * Register custom serializers for superjson to handle problematic objects
 * that contain circular references, particularly React Fiber nodes and DOM elements.
 */
export function registerSuperjsonCustomSerializers(): void {
  // Register custom serializer for HTMLCanvasElement specifically (before general HTMLElement)
  superjson.registerCustom<HTMLCanvasElement, string>(
    {
      isApplicable: (v): v is HTMLCanvasElement => {
        return v instanceof HTMLCanvasElement;
      },
      serialize: (canvas) => {
        const width = canvas.width || 0;
        const height = canvas.height || 0;
        const id = canvas.id ? `#${canvas.id}` : "";
        const className = canvas.className
          ? `.${canvas.className.split(" ").join(".")}`
          : "";
        return `[HTMLCanvasElement: ${width}x${height}${id}${className}]`;
      },
      deserialize: (str) => {
        // Create a placeholder canvas element
        const canvas = document.createElement("canvas");
        canvas.setAttribute("data-placeholder", str);
        return canvas;
      },
    },
    "htmlCanvas"
  );

  // Register custom serializer for any DOM Node with React Fiber properties (broader catch)
  superjson.registerCustom<Node, string>(
    {
      isApplicable: (v): v is Node => {
        return (
          v instanceof Node &&
          typeof v === "object" &&
          v !== null &&
          Object.keys(v).some((key) => key.includes("__reactFiber"))
        );
      },
      serialize: (node) => {
        if (node instanceof HTMLElement) {
          const tagName = node.tagName?.toLowerCase() || "unknown";
          const id = node.id ? `#${node.id}` : "";
          const className = node.className
            ? `.${node.className.split(" ").join(".")}`
            : "";
          return `[DOM: ${tagName}${id}${className}]`;
        }
        return `[DOM: ${node.nodeName || node.constructor?.name || "Node"}]`;
      },
      deserialize: (str) => {
        const div = document.createElement("div");
        div.setAttribute("data-placeholder", str);
        return div;
      },
    },
    "domNodeWithFiber"
  );

  // Register custom serializer for HTMLElement with React Fiber properties
  superjson.registerCustom<HTMLElement, string>(
    {
      isApplicable: (v): v is HTMLElement => {
        return (
          v instanceof HTMLElement &&
          typeof v === "object" &&
          v !== null &&
          Object.keys(v).some((key) => key.includes("__reactFiber"))
        );
      },
      serialize: (element) => {
        const tagName = element.tagName?.toLowerCase() || "unknown";
        const id = element.id ? `#${element.id}` : "";
        const className = element.className
          ? `.${element.className.split(" ").join(".")}`
          : "";
        return `[HTMLElement: ${tagName}${id}${className}]`;
      },
      deserialize: (str) => {
        // Create a placeholder element - this won't be a real DOM element
        const div = document.createElement("div");
        div.textContent = str;
        return div;
      },
    },
    "htmlElement"
  );

  // Register custom serializer for React FiberNode objects
  superjson.registerCustom<any, string>(
    {
      isApplicable: (v): v is any => {
        return (
          typeof v === "object" &&
          v !== null &&
          (v.constructor?.name === "FiberNode" ||
            (v.hasOwnProperty("stateNode") &&
              v.hasOwnProperty("return") &&
              v.hasOwnProperty("child") &&
              v.hasOwnProperty("sibling")))
        );
      },
      serialize: (fiber) => {
        const componentName =
          fiber.type?.name || fiber.elementType?.name || "Unknown";
        const fiberTag = fiber.tag || "unknown";
        return `[React.FiberNode: ${componentName} (tag: ${fiberTag})]`;
      },
      deserialize: (str) => ({ __placeholder: str }),
    },
    "reactFiber"
  );

  // Register custom serializer for generic objects with React Fiber properties
  superjson.registerCustom<any, string>(
    {
      isApplicable: (v): v is any => {
        return (
          typeof v === "object" &&
          v !== null &&
          !Array.isArray(v) &&
          !(v instanceof HTMLElement) &&
          Object.keys(v).some(
            (key) =>
              key.includes("__reactFiber") ||
              key.includes("_reactInternalFiber")
          )
        );
      },
      serialize: (obj) => {
        const keys = Object.keys(obj);
        const reactKeys = keys.filter(
          (k) => k.includes("__reactFiber") || k.includes("_reactInternalFiber")
        );
        return `[Object with React Fiber properties: ${reactKeys.join(", ")}]`;
      },
      deserialize: (str) => ({ __placeholder: str }),
    },
    "objectWithFiber"
  );

  // Register custom serializer for Functions
  superjson.registerCustom<Function, string>(
    {
      isApplicable: (v): v is Function => typeof v === "function",
      serialize: (fn) => `[Function: ${fn.name || "anonymous"}]`,
      deserialize: (str) => (() => {}) as any, // Return a dummy function
    },
    "function"
  );

  // Register custom serializer for Symbols
  superjson.registerCustom<Symbol, string>(
    {
      isApplicable: (v): v is Symbol => typeof v === "symbol",
      serialize: (sym) => `[Symbol: ${sym.description || "no description"}]`,
      deserialize: (str) => Symbol(str) as any, // Return a new symbol
    },
    "symbol"
  );

  // Register custom serializer for undefined (sometimes needed in complex objects)
  superjson.registerCustom<undefined, string>(
    {
      isApplicable: (v): v is undefined => v === undefined,
      serialize: () => "[undefined]",
      deserialize: () => undefined,
    },
    "undefined"
  );
}
