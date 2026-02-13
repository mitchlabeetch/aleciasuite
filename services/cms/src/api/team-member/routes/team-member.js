module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/team-members',
      handler: 'team-member.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/team-members/:id',
      handler: 'team-member.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/team-members',
      handler: 'team-member.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/team-members/:id',
      handler: 'team-member.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/team-members/:id',
      handler: 'team-member.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
