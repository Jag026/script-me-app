'use strict';
module.exports = (sequelize, DataTypes) => {
  const Script = sequelize.define('Script', {
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    }
  }, {});
  Script.associate = function (models) {
    Script.belongsTo(models.User, {
      as: 'user',
      foreignKey: 'userId'
    });
  };
  return Script;
};