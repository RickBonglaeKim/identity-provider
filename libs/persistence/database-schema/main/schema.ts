import { mysqlTable, mysqlSchema, AnyMySqlColumn, foreignKey, primaryKey, bigint, datetime, varchar, date, unique, text, tinyint, int, index } from "drizzle-orm/mysql-core"
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
	id: bigint({ mode: "number" }).notNull(),
	createdAt: datetime("created_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	clientId: varchar("client_id", { length: 32 }).notNull(),
	clientSecret: varchar("client_secret", { length: 64 }).notNull(),
	name: varchar({ length: 32 }).notNull(),
	signCode: varchar("sign_code", { length: 16 }).notNull(),
	note: varchar({ length: 256 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "client_id"}),
	unique("client_ix__client_id").on(table.clientId),
]);

export const clientConsent = mysqlTable("client_consent", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	clientId: bigint("client_id", { mode: "number" }).notNull().references(() => client.id),
	createdAt: datetime("created_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	title: varchar({ length: 64 }).notNull(),
	content: text().notNull(),
	isRequired: tinyint("is_required").notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "client_consent_id"}),
]);

export const clientKeypair = mysqlTable("client_keypair", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	clientId: bigint("client_id", { mode: "number" }).notNull().references(() => client.id),
	createdAt: datetime("created_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	privateKey: text("private_key").notNull(),
	publicKey: text("public_key").notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "client_keypair_id"}),
]);

export const clientMember = mysqlTable("client_member", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	memberId: bigint("member_id", { mode: "number" }).notNull().references(() => member.id),
	clientId: bigint("client_id", { mode: "number" }).notNull().references(() => client.id),
	createdAt: datetime("created_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "client_member_id"}),
	unique("client_member_ix__member_id__client_id").on(table.memberId, table.clientId),
]);

export const clientUri = mysqlTable("client_uri", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	clientId: bigint("client_id", { mode: "number" }).notNull().references(() => client.id),
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

export const idTokenKeypair = mysqlTable("id_token_keypair", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	createdAt: datetime("created_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	isActivated: tinyint("is_activated").default(1).notNull(),
	privateKey: text("private_key").notNull(),
	publicKey: text("public_key").notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "id_token_keypair_id"}),
]);

export const member = mysqlTable("member", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	createdAt: datetime("created_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	isConsentedArtBonbonTermsAndConditions: tinyint("is_consented__art_bonbon__terms_and_conditions").notNull(),
	isConsentedILandTermsAndConditions: tinyint("is_consented__i_land__terms_and_conditions").notNull(),
	isConsentedGalleryBonbonTermsAndConditions: tinyint("is_consented__gallery_bonbon__terms_and_conditions").notNull(),
	isConsentedCollectionAndUsePersonalData: tinyint("is_consented__collection_and_use_personal_data").notNull(),
	isConsentedUseAiSketchService: tinyint("is_consented__use_ai_sketch_service").notNull(),
	isConsentedOver14Years: tinyint("is_consented__over_14_years").notNull(),
	isConsentedEventAndInformationReceiving: tinyint("is_consented__event_and_information_receiving").notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "member_id"}),
]);

export const memberConsent = mysqlTable("member_consent", {
	clientConsentId: bigint("client_consent_id", { mode: "number" }).notNull().references(() => clientConsent.id),
	clientMemberId: bigint("client_member_id", { mode: "number" }).notNull().references(() => clientMember.id),
	createdAt: datetime("created_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	isConsented: tinyint("is_consented").notNull(),
},
(table) => [
	primaryKey({ columns: [table.clientConsentId, table.clientMemberId], name: "member_consent_client_consent_id_client_member_id"}),
]);

export const memberDetail = mysqlTable("member_detail", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	memberDetailId: bigint("member_detail_id", { mode: "number" }),
	providerId: bigint("provider_id", { mode: "number" }).notNull().references(() => provider.id),
	memberId: bigint("member_id", { mode: "number" }).notNull().references(() => member.id),
	memberProviderKey: varchar("member_provider_key", { length: 128 }).notNull(),
	createdAt: datetime("created_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	name: varchar({ length: 32 }).notNull(),
	email: varchar({ length: 64 }).notNull(),
	password: varchar({ length: 256 }).notNull(),
	codeDuplicationType: varchar("code__duplication_type", { length: 32 }).notNull(),
},
(table) => [
	index("member_detail_ix__email").on(table.email),
	foreignKey({
			columns: [table.memberDetailId],
			foreignColumns: [table.id],
			name: "id_member_detail"
		}),
	primaryKey({ columns: [table.id], name: "member_detail_id"}),
	unique("member_detail_ix__member_provider_key").on(table.memberProviderKey),
]);

export const memberDetailPhone = mysqlTable("member_detail_phone", {
	memberDetailId: bigint("member_detail_id", { mode: "number" }).notNull().references(() => memberDetail.id),
	memberPhoneId: bigint("member_phone_id", { mode: "number" }).notNull().references(() => memberPhone.id),
	createdAt: datetime("created_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.memberDetailId, table.memberPhoneId], name: "member_detail_phone_member_detail_id_member_phone_id"}),
]);

export const memberPhone = mysqlTable("member_phone", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	memberPhoneId: bigint("member_phone_id", { mode: "number" }),
	memberId: bigint("member_id", { mode: "number" }).notNull().references(() => member.id),
	createdAt: datetime("created_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	countryCallingCode: varchar("country_calling_code", { length: 3 }).notNull(),
	phoneNumber: varchar("phone_number", { length: 16 }).notNull(),
},
(table) => [
	foreignKey({
			columns: [table.memberPhoneId],
			foreignColumns: [table.id],
			name: "id_member_phone"
		}),
	primaryKey({ columns: [table.id], name: "member_phone_id"}),
	unique("member_phone_ix__phone_number").on(table.countryCallingCode, table.phoneNumber),
]);

export const memberWithdrawal = mysqlTable("member_withdrawal", {
	memberId: bigint("member_id", { mode: "number" }).notNull().references(() => member.id),
	createdAt: datetime("created_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	codeReason: varchar("code__reason", { length: 32 }).notNull(),
	reasonExplanation: varchar("reason_explanation", { length: 256 }),
},
(table) => [
	primaryKey({ columns: [table.memberId], name: "member_withdrawal_member_id"}),
]);

export const provider = mysqlTable("provider", {
	id: bigint({ mode: "number" }).notNull(),
	createdAt: datetime("created_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	name: varchar({ length: 16 }).notNull(),
	note: varchar({ length: 256 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "provider_id"}),
]);

export const withdrawalSchedule = mysqlTable("withdrawal_schedule", {
	memberId: bigint("member_id", { mode: "number" }).notNull().references(() => member.id),
	createdAt: datetime("created_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 6 }).default(sql`(sysdate(6))`).notNull(),
	bookedAt: datetime("booked_at", { mode: 'string', fsp: 6 }).notNull(),
	codeReason: varchar("code__reason", { length: 32 }).notNull(),
	reasonExplanation: varchar("reason_explanation", { length: 256 }),
},
(table) => [
	primaryKey({ columns: [table.memberId], name: "withdrawal_schedule_member_id"}),
]);
