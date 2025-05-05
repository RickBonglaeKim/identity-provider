import { mysqlTable, mysqlSchema, AnyMySqlColumn, foreignKey, primaryKey, bigint, datetime, varchar, date, text, int, tinyint, unique } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const child = mysqlTable("child", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	memberId: bigint("member_id", { mode: "number" }).notNull().references(() => member.id),
	createdAt: datetime("created_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	name: varchar({ length: 16 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	birthday: date({ mode: 'string' }),
	codeGender: varchar("code__gender", { length: 32 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "child_id"}),
]);

export const client = mysqlTable("client", {
	key: varchar({ length: 32 }).notNull(),
	createdAt: datetime("created_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	clientSecret: varchar("client_secret", { length: 64 }).notNull(),
	name: varchar({ length: 32 }).notNull(),
	note: varchar({ length: 256 }),
},
(table) => [
	primaryKey({ columns: [table.key], name: "client_key"}),
]);

export const clientKeypair = mysqlTable("client_keypair", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	clientKey: varchar("client_key", { length: 32 }).notNull().references(() => client.key),
	createdAt: datetime("created_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	privateKey: text("private_key").notNull(),
	publicKey: text("public_key").notNull(),
	version: int().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "client_keypair_id"}),
]);

export const clientUri = mysqlTable("client_uri", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	clientKey: varchar("client_key", { length: 32 }).notNull().references(() => client.key),
	createdAt: datetime("created_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	redirectUri: varchar("redirect_uri", { length: 128 }).notNull(),
	note: varchar({ length: 256 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "client_uri_id"}),
]);

export const code = mysqlTable("code", {
	id: varchar({ length: 32 }).notNull(),
	parentId: varchar("parent_id", { length: 32 }),
	createdAt: datetime("created_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	name: varchar({ length: 64 }).notNull(),
	order: int().default(0).notNull(),
	note: varchar({ length: 256 }),
},
(table) => [
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "id_parent_id"
		}),
	primaryKey({ columns: [table.id], name: "code_id"}),
]);

export const member = mysqlTable("member", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	clientKey: varchar("client_key", { length: 32 }).notNull().references(() => client.key),
	providerKey: varchar("provider_key", { length: 32 }).references(() => provider.key),
	createdAt: datetime("created_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	isAgreedTerms: tinyint("is_agreed_terms").notNull(),
	isAgreedPrivacy: tinyint("is_agreed_privacy").notNull(),
	isMoreThanFourteen: tinyint("is_more_than_fourteen").notNull(),
	isAgreedMarketing: tinyint("is_agreed_marketing").notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "member_id"}),
]);

export const memberDetail = mysqlTable("member_detail", {
	memberId: bigint("member_id", { mode: "number" }).notNull().references(() => member.id),
	createdAt: datetime("created_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	name: varchar({ length: 32 }).notNull(),
	email: varchar({ length: 64 }).notNull(),
	password: varchar({ length: 256 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.memberId], name: "member_detail_member_id"}),
	unique("member_detail_ix__email").on(table.email),
]);

export const memberPhone = mysqlTable("member_phone", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	memberId: bigint("member_id", { mode: "number" }).notNull().references(() => member.id),
	createdAt: datetime("created_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	isPrimary: tinyint("is_primary").notNull(),
	countryCallingCode: varchar("country_calling_code", { length: 3 }).notNull(),
	phoneNumber: varchar("phone_number", { length: 16 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "member_phone_id"}),
	unique("member_phone_ix__phone_number").on(table.countryCallingCode, table.phoneNumber),
]);

export const memberWithdrawal = mysqlTable("member_withdrawal", {
	memberId: bigint("member_id", { mode: "number" }).notNull().references(() => member.id),
	createdAt: datetime("created_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	reason: varchar({ length: 128 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.memberId], name: "member_withdrawal_member_id"}),
]);

export const provider = mysqlTable("provider", {
	key: varchar({ length: 32 }).notNull(),
	createdAt: datetime("created_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	name: varchar({ length: 16 }).notNull(),
	note: varchar({ length: 256 }),
},
(table) => [
	primaryKey({ columns: [table.key], name: "provider_key"}),
]);
