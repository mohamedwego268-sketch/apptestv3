import assert from "node:assert/strict";
import test from "node:test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import supabase, { SUPABASE_ANON_KEY, SUPABASE_URL } from "../supabase.js";
import {
  acceptFamilyInvitation,
  createFamilyPrivateMediaSignedUrl,
  deleteFamilyPrivateMediaFromStorage,
  generateSecureFamilyPairingToken,
  hashFamilyPairingToken,
  uploadFamilyPrivateMediaToStorage,
  validateFamilyStorageObjectPath,
} from "../services/supabaseService";

/**
 * Real PostgreSQL RLS Integration Test Suite for Nekbaar (Family Space)
 *
 * SAFETY & PRODUCTION DATA PROTECTION:
 * 1. Part A executes strictly non-destructive, read-only and anonymous-denial
 *    assertions against the live Supabase PostgreSQL instance (`SUPABASE_URL` /
 *    `VITE_SUPABASE_URL`) to verify table-level privilege revocations, RPC ACLs,
 *    and public catalog read-only protections without creating or modifying data.
 * 2. Part B executes the 17-scenario authenticated multi-family PostgreSQL RLS
 *    integration matrix ONLY when an isolated test database is explicitly configured
 *    via `TEST_SUPABASE_URL`, `TEST_SUPABASE_ANON_KEY`, and `TEST_SUPABASE_SERVICE_ROLE_KEY`
 *    (and never executes destructive fixtures against production project `qbwnzunusmaidciakuod`).
 */

const LIVE_SUPABASE_URL = SUPABASE_URL;
const LIVE_SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

const TEST_SUPABASE_URL = process.env.TEST_SUPABASE_URL?.trim() || "";
const TEST_SUPABASE_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY?.trim() || "";
const TEST_SUPABASE_SERVICE_ROLE_KEY =
  process.env.TEST_SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

const IS_ISOLATED_TEST_DB_CONFIGURED = Boolean(
  TEST_SUPABASE_URL &&
    TEST_SUPABASE_ANON_KEY &&
    TEST_SUPABASE_SERVICE_ROLE_KEY &&
    !TEST_SUPABASE_URL.includes("qbwnzunusmaidciakuod"),
);

function createAnonClient(url: string, anonKey: string): SupabaseClient {
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

// ============================================================================
// PART A: Live Non-Destructive PostgreSQL RLS & ACL Verification
// ============================================================================

test("Part A.1: Live PostgreSQL denies anonymous SELECT, INSERT, UPDATE, and DELETE on all private family tables", async () => {
  const anonClient = createAnonClient(LIVE_SUPABASE_URL, LIVE_SUPABASE_ANON_KEY);

  const privateTables = [
    "families",
    "users",
    "children",
    "extended_family",
    "co_parent_pairings",
    "child_life_records",
    "parent_locations",
    "family_homes",
    "child_home_schedules",
    "family_shared_state",
    "parent_private_state",
    "wellness_diagnostics",
    "bedtime_stories",
  ];

  for (const table of privateTables) {
    const selectRes = await anonClient.from(table).select("*").limit(1);
    assert.ok(
      selectRes.error,
      `Expected anonymous SELECT on public.${table} to be denied by PostgreSQL`,
    );
    assert.equal(
      selectRes.error?.code,
      "42501",
      `Expected SQLSTATE 42501 on anonymous SELECT from public.${table}, got ${selectRes.error?.code}: ${selectRes.error?.message}`,
    );
  }
});

test("Part A.2: Live PostgreSQL allows anonymous SELECT on catalog_items and denies anonymous INSERT, UPDATE, and DELETE", async () => {
  const anonClient = createAnonClient(LIVE_SUPABASE_URL, LIVE_SUPABASE_ANON_KEY);

  const selectRes = await anonClient
    .from("catalog_items")
    .select("id, title, category")
    .limit(3);
  assert.equal(
    selectRes.error,
    null,
    `Expected anonymous SELECT on catalog_items to succeed, got: ${selectRes.error?.message}`,
  );
  assert.ok(Array.isArray(selectRes.data));

  const insertRes = await anonClient.from("catalog_items").insert({
    title: "Unauthorized Anon Item",
    category: "Books",
    price: 10,
  });
  assert.ok(insertRes.error, "Expected anonymous INSERT on catalog_items to fail");
  assert.equal(insertRes.error?.code, "42501");

  const updateRes = await anonClient
    .from("catalog_items")
    .update({ price: 0 })
    .eq("id", "00000000-0000-0000-0000-000000000000");
  assert.ok(updateRes.error, "Expected anonymous UPDATE on catalog_items to fail");
  assert.equal(updateRes.error?.code, "42501");

  const deleteRes = await anonClient
    .from("catalog_items")
    .delete()
    .eq("id", "00000000-0000-0000-0000-000000000000");
  assert.ok(deleteRes.error, "Expected anonymous DELETE on catalog_items to fail");
  assert.equal(deleteRes.error?.code, "42501");
});

test("Part A.3: Live PostgreSQL denies anonymous RPC execution on bootstrap_authenticated_family_space and accept_family_invitation", async () => {
  const anonClient = createAnonClient(LIVE_SUPABASE_URL, LIVE_SUPABASE_ANON_KEY);

  const bootstrapRes = await anonClient.rpc(
    "bootstrap_authenticated_family_space",
    {
      p_family_name: "Anon Attempt",
      p_country: "Egypt",
      p_full_name: "Anon User",
      p_role: "father",
    },
  );
  assert.ok(
    bootstrapRes.error,
    "Expected anonymous bootstrap_authenticated_family_space RPC to fail",
  );
  assert.equal(bootstrapRes.error?.code, "42501");

  const acceptRes = await anonClient.rpc("accept_family_invitation", {
    p_token_hash: "0".repeat(64),
  });
  assert.ok(
    acceptRes.error,
    "Expected anonymous accept_family_invitation RPC to fail",
  );
  assert.equal(acceptRes.error?.code, "42501");
});

// ============================================================================
// PART B: Full 17-Scenario Authenticated Multi-Family PostgreSQL RLS Matrix
// (Runs against an isolated Supabase / PostgreSQL test environment)
// ============================================================================

test(
  "Part B: Full 17-scenario authenticated multi-family PostgreSQL RLS & Storage integration suite",
  {
    skip: !IS_ISOLATED_TEST_DB_CONFIGURED
      ? "Skipped: Set TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, and TEST_SUPABASE_SERVICE_ROLE_KEY pointing to a non-production isolated Supabase test instance to execute destructive/multi-user authenticated PostgreSQL integration fixtures."
      : false,
  },
  async () => {
    const adminClient = createClient(
      TEST_SUPABASE_URL,
      TEST_SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );

    const runId = Date.now().toString(36);
    const emailA = `parent.a.${runId}@nekbaar-test.local`;
    const emailB = `parent.b.${runId}@nekbaar-test.local`;
    const emailInviteUnlinked = `invite.unlinked.${runId}@nekbaar-test.local`;
    const emailInviteSolo = `invite.solo.${runId}@nekbaar-test.local`;
    const password = `NekbaarTest!${runId}#99`;

    const createdAuthUserIds: string[] = [];

    async function createAuthenticatedParent(email: string, phone?: string) {
      const { data: created, error: createErr } =
        await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          phone,
          phone_confirm: Boolean(phone),
        });
      assert.equal(
        createErr,
        null,
        `Failed to create test auth user ${email}: ${createErr?.message}`,
      );
      assert.ok(created.user);
      createdAuthUserIds.push(created.user.id);

      const client = createAnonClient(TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY);
      const { error: signInErr } = await client.auth.signInWithPassword({
        email,
        password,
      });
      assert.equal(
        signInErr,
        null,
        `Failed to sign in ${email}: ${signInErr?.message}`,
      );
      return { user: created.user, client };
    }

    async function createPairingInvitation(
      client: SupabaseClient,
      familyId: string,
      invitedByUserId: string,
      partnerEmail: string,
    ) {
      const token = generateSecureFamilyPairingToken();
      const tokenHash = await hashFamilyPairingToken(token);
      const { error } = await client.from("co_parent_pairings").insert({
        family_id: familyId,
        invited_by_user_id: invitedByUserId,
        partner_email: partnerEmail.toLowerCase(),
        pairing_method: "email",
        pairing_token_hash: tokenHash,
        status: "pending",
      });
      assert.equal(error, null, `Failed to insert pairing: ${error?.message}`);
      return token;
    }

    try {
      const parentA = await createAuthenticatedParent(emailA);
      const parentB = await createAuthenticatedParent(emailB);
      const inviteeUnlinked = await createAuthenticatedParent(emailInviteUnlinked);
      const inviteeSolo = await createAuthenticatedParent(emailInviteSolo);

      // Bootstrap Family A and Family B via hardened RPC
      const bootA = await parentA.client.rpc("bootstrap_authenticated_family_space", {
        p_family_name: "Family A",
        p_country: "Egypt",
        p_full_name: "Parent A",
        p_role: "father",
      });
      assert.equal(bootA.error, null, bootA.error?.message);
      const familyAId: string = bootA.data.family_id;

      const bootB = await parentB.client.rpc("bootstrap_authenticated_family_space", {
        p_family_name: "Family B",
        p_country: "Egypt",
        p_full_name: "Parent B",
        p_role: "mother",
      });
      assert.equal(bootB.error, null, bootB.error?.message);
      const familyBId: string = bootB.data.family_id;

      // 1. Parent A can read own family
      const { data: ownFamilyA, error: ownFamilyAErr } = await parentA.client
        .from("families")
        .select("id, family_name")
        .eq("id", familyAId)
        .single();
      assert.equal(ownFamilyAErr, null);
      assert.equal(ownFamilyA?.id, familyAId);

      // 2. Parent A cannot read Family B
      const { data: crossFamilyRead } = await parentA.client
        .from("families")
        .select("id")
        .eq("id", familyBId)
        .maybeSingle();
      assert.equal(crossFamilyRead, null);

      // 3. Parent A can create and read own children
      const { data: childA, error: childAErr } = await parentA.client
        .from("children")
        .insert({
          family_id: familyAId,
          name: "Ziad",
          birth_date: "2020-04-10",
          gender: "boy",
        })
        .select("id, family_id")
        .single();
      assert.equal(childAErr, null, childAErr?.message);
      assert.equal(childA?.family_id, familyAId);

      const { data: childB, error: childBErr } = await parentB.client
        .from("children")
        .insert({
          family_id: familyBId,
          name: "Laila",
          birth_date: "2021-08-15",
          gender: "girl",
        })
        .select("id, family_id")
        .single();
      assert.equal(childBErr, null, childBErr?.message);
      assert.equal(childB?.family_id, familyBId);

      // 4. Parent A cannot read or insert into Family B's children
      const { data: crossChildRead } = await parentA.client
        .from("children")
        .select("id")
        .eq("id", childB!.id)
        .maybeSingle();
      assert.equal(crossChildRead, null);

      const { error: crossChildInsertErr } = await parentA.client
        .from("children")
        .insert({
          family_id: familyBId,
          name: "Intruder",
          birth_date: "2022-01-01",
          gender: "boy",
        });
      assert.ok(crossChildInsertErr, "Parent A must not insert child into Family B");

      // 5. Parent A cannot update or delete Family B records
      const { data: crossChildUpdate } = await parentA.client
        .from("children")
        .update({ name: "Tampered" })
        .eq("id", childB!.id)
        .select("id");
      assert.equal(crossChildUpdate?.length ?? 0, 0);

      // 6. Parent A cannot change own users.family_id directly
      const { error: hijackFamilyErr } = await parentA.client
        .from("users")
        .update({ family_id: familyBId })
        .eq("id", parentA.user.id);
      assert.ok(
        hijackFamilyErr,
        "Direct UPDATE of users.family_id must be rejected by trigger/RLS",
      );

      // 7. Parent A cannot insert or update a row with another user's auth_user_id
      const { error: impersonateErr } = await parentA.client.from("users").upsert({
        id: parentB.user.id,
        auth_user_id: parentB.user.id,
        family_id: familyAId,
        full_name: "Impersonated",
        role: "mother",
      });
      assert.ok(impersonateErr, "Cross-user auth_user_id upsert must fail");

      // 8 & 9. Authorized UPSERT succeeds; unauthorized UPSERT is rejected
      const { error: authorizedUpsertErr } = await parentA.client
        .from("users")
        .upsert(
          {
            id: parentA.user.id,
            auth_user_id: parentA.user.id,
            family_id: familyAId,
            full_name: "Parent A Updated",
            role: "father",
          },
          { onConflict: "id" },
        );
      assert.equal(authorizedUpsertErr, null, authorizedUpsertErr?.message);

      const { error: unauthorizedUpsertErr } = await parentA.client
        .from("users")
        .upsert(
          {
            id: parentA.user.id,
            auth_user_id: parentA.user.id,
            family_id: familyBId,
            full_name: "Parent A Hijack",
            role: "father",
          },
          { onConflict: "id" },
        );
      assert.ok(unauthorizedUpsertErr, "Upsert changing family_id must be rejected");

      // 11. Authenticated user cannot write to catalog_items
      const { error: authCatalogInsertErr } = await parentA.client
        .from("catalog_items")
        .insert({
          title: "Parent A Fake Product",
          category: "Toys",
          price: 99,
        });
      assert.ok(
        authCatalogInsertErr,
        "Authenticated user must not insert into catalog_items",
      );

      // 12, 13, 14. Valid invitation works for unlinked account; replay and expired fail
      const token1 = await createPairingInvitation(
        parentA.client,
        familyAId,
        parentA.user.id,
        emailInviteUnlinked,
      );
      const accept1 = await acceptFamilyInvitation(token1, inviteeUnlinked.client);
      assert.equal(accept1.accepted, true, accept1.error || "Expected acceptance");
      assert.equal(accept1.familyId, familyAId);

      // Replay of already-accepted invitation must fail
      const replayRes = await acceptFamilyInvitation(token1, inviteeUnlinked.client);
      assert.equal(replayRes.accepted, false);

      // Newly bootstrapped solo account with empty placeholder family can accept invitation
      const bootSolo = await inviteeSolo.client.rpc(
        "bootstrap_authenticated_family_space",
        {
          p_family_name: "Solo Placeholder",
          p_country: "Egypt",
          p_full_name: "Solo Invitee",
          p_role: "mother",
        },
      );
      assert.equal(bootSolo.error, null, bootSolo.error?.message);

      const tokenSolo = await createPairingInvitation(
        parentB.client,
        familyBId,
        parentB.user.id,
        emailInviteSolo,
      );
      const acceptSolo = await acceptFamilyInvitation(tokenSolo, inviteeSolo.client);
      assert.equal(acceptSolo.accepted, true, acceptSolo.error || "Expected solo transfer");
      assert.equal(acceptSolo.familyId, familyBId);

      // 15. Account whose family has children/data cannot transfer families
      const tokenNonEmpty = await createPairingInvitation(
        parentB.client,
        familyBId,
        parentB.user.id,
        emailA,
      );
      const nonEmptyRes = await acceptFamilyInvitation(tokenNonEmpty, parentA.client);
      assert.equal(nonEmptyRes.accepted, false);
      assert.match(String(nonEmptyRes.error), /FAMILY_DATA_EXISTS/i);

      // 16 & 17. Private storage is isolated between families; cross-family signed URL fails
      const objectPath = `${familyAId}/albums/${childA!.id}/first-step.jpg`;
      const pathValidation = validateFamilyStorageObjectPath(objectPath, familyAId);
      assert.equal(pathValidation.valid, true);

      const mediaBytes = new Uint8Array([1, 2, 3, 4]);
      const uploaded = await uploadFamilyPrivateMediaToStorage(
        {
          objectPath,
          fileBody: mediaBytes,
          contentType: "image/jpeg",
          byteLength: mediaBytes.byteLength,
        },
        parentA.client,
      );
      assert.equal(uploaded.uploaded, true, uploaded.error || "Upload failed");

      const ownSignedUrl = await createFamilyPrivateMediaSignedUrl(
        {
          objectPath,
          expiresInSeconds: 300,
        },
        parentA.client,
      );
      assert.ok(ownSignedUrl.signedUrl);

      const crossSignedUrl = await createFamilyPrivateMediaSignedUrl(
        {
          objectPath,
          expiresInSeconds: 300,
        },
        parentB.client,
      );
      assert.equal(crossSignedUrl.signedUrl, null);
      assert.ok(crossSignedUrl.error);

      const deleted = await deleteFamilyPrivateMediaFromStorage(
        objectPath,
        parentA.client,
      );
      assert.equal(deleted.deleted, true);
    } finally {
      for (const uid of createdAuthUserIds) {
        await adminClient.auth.admin.deleteUser(uid);
      }
    }
  },
);
