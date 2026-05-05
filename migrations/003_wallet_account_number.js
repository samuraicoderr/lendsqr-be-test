function generateAccountNumber() {
  let accountNumber = "";

  for (let i = 0; i < 11; i += 1) {
    accountNumber += Math.floor(Math.random() * 10).toString();
  }

  return accountNumber;
}

exports.up = async function up(knex) {
  await knex.schema.alterTable("wallets", (table) => {
    table.string("account_number", 11).nullable();
  });

  const wallets = await knex("wallets").select("id");
  const usedAccountNumbers = new Set();

  for (const wallet of wallets) {
    let accountNumber = generateAccountNumber();

    while (usedAccountNumbers.has(accountNumber)) {
      accountNumber = generateAccountNumber();
    }

    usedAccountNumbers.add(accountNumber);
    await knex("wallets").where({ id: wallet.id }).update({ account_number: accountNumber });
  }

  await knex.schema.alterTable("wallets", (table) => {
    table.string("account_number", 11).notNullable().alter();
    table.unique(["account_number"], "wallets_account_number_unique");
  });
};

exports.down = async function down(knex) {
  await knex.schema.alterTable("wallets", (table) => {
    table.dropUnique(["account_number"], "wallets_account_number_unique");
    table.dropColumn("account_number");
  });
};
