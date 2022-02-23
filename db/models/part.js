'use strict';
module.exports = (sequelize, DataTypes) => {
  const Part = sequelize.define('Part', {
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    scriptId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }
  }, {});
  Part.associate = function (models) {

  };
  return Part;
};