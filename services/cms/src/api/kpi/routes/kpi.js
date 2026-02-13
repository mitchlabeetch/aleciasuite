module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/kpis',
      handler: 'kpi.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/kpis/:id',
      handler: 'kpi.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/kpis',
      handler: 'kpi.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/kpis/:id',
      handler: 'kpi.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/kpis/:id',
      handler: 'kpi.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
