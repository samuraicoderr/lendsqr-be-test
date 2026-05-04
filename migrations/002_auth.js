exports.up = async function up(knex) {
  await knex.schema.alterTable("users", (table) => {
    table.string("password_hash", 255).notNullable().defaultTo("");
    table.boolean("is_email_verified").notNullable().defaultTo(false);
    table.boolean("is_two_factor_enabled").notNullable().defaultTo(false);
    table.boolean("is_admin").notNullable().defaultTo(true);
    table.string("email_verification_token_hash", 255).nullable();
    table.timestamp("email_verification_expires_at").nullable();
    table.timestamp("email_verified_at").nullable();
  });
};

exports.down = async function down(knex) {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("password_hash");
    table.dropColumn("is_email_verified");
    table.dropColumn("is_two_factor_enabled");
    table.dropColumn("is_admin");
    table.dropColumn("email_verification_token_hash");
    table.dropColumn("email_verification_expires_at");
    table.dropColumn("email_verified_at");
  });
};
