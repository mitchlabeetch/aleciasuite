module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/partner-logos',
      handler: 'partner-logo.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/partner-logos/:id',
      handler: 'partner-logo.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/partner-logos',
      handler: 'partner-logo.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/partner-logos/:id',
      handler: 'partner-logo.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/partner-logos/:id',
      handler: 'partner-logo.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
