import { relations } from "drizzle-orm/relations";
import { member, child, client, clientConsent, clientKeypair, clientMember, clientUri, code, memberConsent, memberDetail, provider, memberPhone, memberWithdrawal } from "./schema";

export const childRelations = relations(child, ({one}) => ({
	member: one(member, {
		fields: [child.memberId],
		references: [member.id]
	}),
}));

export const memberRelations = relations(member, ({many}) => ({
	children: many(child),
	clientMembers: many(clientMember),
	memberDetails: many(memberDetail),
	memberPhones: many(memberPhone),
	memberWithdrawals: many(memberWithdrawal),
}));

export const clientConsentRelations = relations(clientConsent, ({one, many}) => ({
	client: one(client, {
		fields: [clientConsent.clientKey],
		references: [client.key]
	}),
	memberConsents: many(memberConsent),
}));

export const clientRelations = relations(client, ({many}) => ({
	clientConsents: many(clientConsent),
	clientKeypairs: many(clientKeypair),
	clientMembers: many(clientMember),
	clientUris: many(clientUri),
}));

export const clientKeypairRelations = relations(clientKeypair, ({one}) => ({
	client: one(client, {
		fields: [clientKeypair.clientKey],
		references: [client.key]
	}),
}));

export const clientMemberRelations = relations(clientMember, ({one, many}) => ({
	client: one(client, {
		fields: [clientMember.clientKey],
		references: [client.key]
	}),
	member: one(member, {
		fields: [clientMember.memberId],
		references: [member.id]
	}),
	memberConsents: many(memberConsent),
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

export const memberConsentRelations = relations(memberConsent, ({one}) => ({
	clientConsent: one(clientConsent, {
		fields: [memberConsent.clientConsentId],
		references: [clientConsent.id]
	}),
	clientMember: one(clientMember, {
		fields: [memberConsent.clientMemberId],
		references: [clientMember.id]
	}),
}));

export const memberDetailRelations = relations(memberDetail, ({one}) => ({
	member: one(member, {
		fields: [memberDetail.memberId],
		references: [member.id]
	}),
	provider: one(provider, {
		fields: [memberDetail.providerKey],
		references: [provider.key]
	}),
}));

export const providerRelations = relations(provider, ({many}) => ({
	memberDetails: many(memberDetail),
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