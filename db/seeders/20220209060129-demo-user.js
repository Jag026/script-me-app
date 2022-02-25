'use strict';

const bcrypt = require('bcrypt-nodejs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const users = await queryInterface.bulkInsert('Users', [
      {
        emailAddress: 'john@smith.com',
        firstName: 'John',
        lastName: 'Smith',
        hashedPassword: bcrypt.hashSync('Password1!', 10),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], { returning: true });

    return queryInterface.bulkInsert('Scripts', [
      { userId: users[0].id,
        title: 'The Martian',
        createdAt: new Date(),
        updatedAt: new Date(),
        
      },
      { userId: users[0].id,
        title: 'Ready Player One',
        createdAt: new Date(),
        updatedAt: new Date(),
        
      },
      { userId: users[0].id,
        title: 'Harry Potter and the Sorcerers Stone',
        createdAt: new Date(),
        updatedAt: new Date(),
        
      },
    ], {});
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Scripts', null, {});
    return queryInterface.bulkDelete('Users', null, {});
  }
};