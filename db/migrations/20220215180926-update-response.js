'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Responses', 'linkedPartId', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
  },
  down: (queryInterface, Sequelize) => {
  }
};