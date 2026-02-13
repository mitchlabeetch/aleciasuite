module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/faqs',
      handler: 'faq.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/faqs/:id',
      handler: 'faq.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/faqs',
      handler: 'faq.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/faqs/:id',
      handler: 'faq.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/faqs/:id',
      handler: 'faq.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
