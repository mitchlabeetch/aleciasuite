module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/page-contents',
      handler: 'page-content.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/page-contents/:id',
      handler: 'page-content.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/page-contents',
      handler: 'page-content.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/page-contents/:id',
      handler: 'page-content.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/page-contents/:id',
      handler: 'page-content.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
