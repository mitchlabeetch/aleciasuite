module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/global-configs',
      handler: 'global-config.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/global-configs/:id',
      handler: 'global-config.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/global-configs',
      handler: 'global-config.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/global-configs/:id',
      handler: 'global-config.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/global-configs/:id',
      handler: 'global-config.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
