const Joi = require('joi');

const validatePollCreation = (data) => {
  const schema = Joi.object({
    question: Joi.string()
      .trim()
      .min(5)
      .max(500)
      .required()
      .messages({
        'string.empty': 'Question cannot be empty',
        'string.min': 'Question must be at least 5 characters',
        'string.max': 'Question cannot exceed 500 characters',
      }),
    options: Joi.array()
      .items(
        Joi.object({
          text: Joi.string()
            .trim()
            .min(1)
            .max(200)
            .required()
            .messages({
              'string.empty': 'Option cannot be empty',
              'string.max': 'Option cannot exceed 200 characters',
            }),
        })
      )
      .min(2)
      .max(10)
      .required()
      .messages({
        'array.min': 'Poll must have at least 2 options',
        'array.max': 'Poll cannot have more than 10 options',
      }),
  });

  return schema.validate(data);
};

const validateVote = (data) => {
  const schema = Joi.object({
    optionId: Joi.string().required().messages({
      'string.empty': 'Option ID is required',
    }),
  });

  return schema.validate(data);
};

module.exports = {
  validatePollCreation,
  validateVote,
};
