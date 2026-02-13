module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/location-images',
      handler: 'location-image.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/location-images/:id',
      handler: 'location-image.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/location-images',
      handler: 'location-image.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/location-images/:id',
      handler: 'location-image.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/location-images/:id',
      handler: 'location-image.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
