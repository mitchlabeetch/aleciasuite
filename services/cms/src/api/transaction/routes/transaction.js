module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/transactions',
      handler: 'transaction.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/transactions/:id',
      handler: 'transaction.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/transactions',
      handler: 'transaction.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/transactions/:id',
      handler: 'transaction.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/transactions/:id',
      handler: 'transaction.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
