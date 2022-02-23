'use strict';
module.exports = (sequelize, DataTypes) => {
  const Response = sequelize.define('Response', {
    body: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    partId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    linkedPartId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }
  }, {});
  Response.associate = function (models) {

  };
  return Response;
};