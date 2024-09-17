export const commands = {
  whoami: async (...args) => (await import('./whoami.mjs')).default(...args),

  promote: async (...args) => (await import('./promote.mjs')).default(...args),

  init: async (...args) => (await import('./init.mjs')).default(...args),

  configure: async (...args) => (await import('./configure.mjs')).default(...args),

  listModules: async (...args) => (await import('./list-modules.mjs')).default(...args),

  package: async (...args) => (await import('./package.mjs')).default(...args),

  create: async (...args) => (await import('./create.mjs')).default(...args),

  push: async (...args) => (await import('./push.mjs')).default(...args),

  validate: async (...args) => (await import('./validate.mjs')).default(...args)
}
