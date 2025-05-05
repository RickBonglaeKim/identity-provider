import { relations } from "drizzle-orm/relations";
import { member, child, client, clientKeypair, clientUri, code, provider, memberDetail, memberPhone, memberWithdrawal } from "./schema";

export const childRelations = relations(child, ({one}) => ({
	member: one(member, {
		fields: [child.memberId],
		references: [member.id]
	}),
}));

export const memberRelations = relations(member, ({one, many}) => ({
	children: many(child),
	client: one(client, {
		fields: [member.clientKey],
		references: [client.key]
	}),
	provider: one(provider, {
		fields: [member.providerKey],
		references: [provider.key]
	}),
	memberDetails: many(memberDetail),
	memberPhones: many(memberPhone),
	memberWithdrawals: many(memberWithdrawal),
}));

export const clientKeypairRelations = relations(clientKeypair, ({one}) => ({
	client: one(client, {
		fields: [clientKeypair.clientKey],
		references: [client.key]
	}),
}));

export const clientRelations = relations(client, ({many}) => ({
	clientKeypairs: many(clientKeypair),
	clientUris: many(clientUri),
	members: many(member),
}));

export const clientUriRelations = relations(clientUri, ({one}) => ({
	client: one(client, {
		fields: [clientUri.clientKey],
		references: [client.key]
	}),
}));

export const codeRelations = relations(code, ({one, many}) => ({
	code: one(code, {
		fields: [code.parentId],
		references: [code.id],
		relationName: "code_parentId_code_id"
	}),
	codes: many(code, {
		relationName: "code_parentId_code_id"
	}),
}));

export const providerRelations = relations(provider, ({many}) => ({
	members: many(member),
}));

export const memberDetailRelations = relations(memberDetail, ({one}) => ({
	member: one(member, {
		fields: [memberDetail.memberId],
		references: [member.id]
	}),
}));

export const memberPhoneRelations = relations(memberPhone, ({one}) => ({
	member: one(member, {
		fields: [memberPhone.memberId],
		references: [member.id]
	}),
}));

export const memberWithdrawalRelations = relations(memberWithdrawal, ({one}) => ({
	member: one(member, {
		fields: [memberWithdrawal.memberId],
		references: [member.id]
	}),
}));