module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/job-offers',
      handler: 'job-offer.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/job-offers/:id',
      handler: 'job-offer.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/job-offers',
      handler: 'job-offer.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/job-offers/:id',
      handler: 'job-offer.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/job-offers/:id',
      handler: 'job-offer.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
