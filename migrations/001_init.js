exports.up = async function up(knex) {
  await knex.schema.createTable("users", (table) => {
    table.string("id", 36).primary();
    table.string("first_name", 100).notNullable();
    table.string("last_name", 100).notNullable();
    table.string("email", 255).notNullable().unique();
    table.boolean("is_blacklisted").notNullable().defaultTo(false);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });

  await knex.schema.createTable("wallets", (table) => {
    table.string("id", 36).primary();
    table.string("user_id", 36).notNullable().unique();
    table.decimal("balance", 18, 2).notNullable().defaultTo("0.00");
    table.string("currency", 10).notNullable().defaultTo("NGN");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    table
      .foreign("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
  });

  await knex.schema.createTable("transactions", (table) => {
    table.string("id", 36).primary();
    table.string("wallet_id", 36).notNullable();
    table.enu("type", ["credit", "debit"]).notNullable();
    table.decimal("amount", 18, 2).notNullable();
    table.string("reference", 100).notNullable().unique();
    table
      .enu("status", ["pending", "success", "failed"])
      .notNullable()
      .defaultTo("success");
    table.json("metadata").nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .foreign("wallet_id")
      .references("id")
      .inTable("wallets")
      .onDelete("CASCADE");
    table.index(["wallet_id", "created_at"], "transactions_wallet_created_idx");
  });

  await knex.schema.createTable("transfers", (table) => {
    table.string("id", 36).primary();
    table.string("sender_wallet_id", 36).notNullable();
    table.string("receiver_wallet_id", 36).notNullable();
    table.decimal("amount", 18, 2).notNullable();
    table.string("reference", 100).notNullable().unique();
    table
      .enu("status", ["pending", "success", "failed"])
      .notNullable()
      .defaultTo("success");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .foreign("sender_wallet_id")
      .references("id")
      .inTable("wallets")
      .onDelete("CASCADE");
    table
      .foreign("receiver_wallet_id")
      .references("id")
      .inTable("wallets")
      .onDelete("CASCADE");
    table.index(["sender_wallet_id"], "transfers_sender_idx");
    table.index(["receiver_wallet_id"], "transfers_receiver_idx");
  });

  await knex.raw(
    "ALTER TABLE wallets ADD CONSTRAINT chk_wallet_balance_nonnegative CHECK (balance >= 0)"
  );
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("transfers");
  await knex.schema.dropTableIfExists("transactions");
  await knex.schema.dropTableIfExists("wallets");
  await knex.schema.dropTableIfExists("users");
};
