import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import dotenv from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  acceptFamilyInvitation,
  createFamilyPrivateMediaSignedUrl,
  deleteFamilyPrivateMediaFromStorage,
  generateSecureFamilyPairingToken,
  hashFamilyPairingToken,
  uploadFamilyPrivateMediaToStorage,
  validateFamilyStorageObjectPath,
} from "../services/supabaseService";
import { ALL_ARAB_COUNTRY_CODES, ALL_ARAB_CURRENCIES } from "./arabCountriesRegistry";

for (const envFile of [".env.test", ".env.local", ".env"]) {
  const fullPath = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath, override: false });
  }
}

/**
 * Real PostgreSQL RLS Integration Test Suite for Nekbaar (Family Space)
 *
 * SAFETY & PRODUCTION DATA PROTECTION:
 * - Runs against the single primary Supabase project (`qbwnzunusmaidciakuod`) using uniquely named disposable test accounts and rows, then cleans them up.
 * - Uses ONLY the primary Supabase project (ref: `qbwnzunusmaidciakuod`,
 *   URL: `https://qbwnzunusmaidciakuod.supabase.co`) configured via `TEST_SUPABASE_URL`,
 *   `TEST_SUPABASE_ANON_KEY`, and `TEST_SUPABASE_SERVICE_ROLE_KEY`.
 * - Missing tables, RPCs (`PGRST202` / `PGRST205`), permissions, or missing test environment
 *   variables cause an explicit test failure.
 */

export const PRODUCTION_PROJECT_REF = "qbwnzunusmaidciakuod";
export const PRIMARY_PROJECT_REF = PRODUCTION_PROJECT_REF;
export const PRIMARY_SUPABASE_URL = `https://${PRIMARY_PROJECT_REF}.supabase.co`;

const TEST_SUPABASE_URL =
  process.env.TEST_SUPABASE_URL?.trim() || PRIMARY_SUPABASE_URL;
const TEST_SUPABASE_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY?.trim() || "";
const TEST_SUPABASE_SERVICE_ROLE_KEY =
  process.env.TEST_SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

type SupabaseJwtClaims = {
  ref?: string;
  role?: string;
};

function decodeSupabaseJwtClaims(key: string): SupabaseJwtClaims | null {
  const payloadSegment = key.split(".")[1];
  if (!payloadSegment) return null;

  try {
    return JSON.parse(
      Buffer.from(payloadSegment, "base64url").toString("utf8"),
    ) as SupabaseJwtClaims;
  } catch {
    return null;
  }
}

const TEST_ANON_KEY_CLAIMS = decodeSupabaseJwtClaims(TEST_SUPABASE_ANON_KEY);
const TEST_SERVICE_ROLE_KEY_CLAIMS = decodeSupabaseJwtClaims(
  TEST_SUPABASE_SERVICE_ROLE_KEY,
);

const IS_ISOLATED_TEST_DB_CONFIGURED = Boolean(
  TEST_SUPABASE_URL === PRIMARY_SUPABASE_URL &&
    TEST_ANON_KEY_CLAIMS?.ref === PRIMARY_PROJECT_REF &&
    TEST_ANON_KEY_CLAIMS?.role === "anon" &&
    TEST_SERVICE_ROLE_KEY_CLAIMS?.ref === PRIMARY_PROJECT_REF &&
    TEST_SERVICE_ROLE_KEY_CLAIMS?.role === "service_role",
);

function assertPrimaryProjectTestEnvironment(): void {
  assert.equal(
    TEST_SUPABASE_URL,
    PRIMARY_SUPABASE_URL,
    `Explicit safety failure: Integration tests must target exactly ${PRIMARY_SUPABASE_URL}.`,
  );
  assert.equal(
    TEST_ANON_KEY_CLAIMS?.ref,
    PRIMARY_PROJECT_REF,
    "TEST_SUPABASE_ANON_KEY must be the legacy anon JWT issued by the primary Supabase project.",
  );
  assert.equal(
    TEST_ANON_KEY_CLAIMS?.role,
    "anon",
    "TEST_SUPABASE_ANON_KEY must carry the anon role.",
  );
  assert.equal(
    TEST_SERVICE_ROLE_KEY_CLAIMS?.ref,
    PRIMARY_PROJECT_REF,
    "TEST_SUPABASE_SERVICE_ROLE_KEY must belong to the primary Supabase project, never production.",
  );
  assert.equal(
    TEST_SERVICE_ROLE_KEY_CLAIMS?.role,
    "service_role",
    "TEST_SUPABASE_SERVICE_ROLE_KEY must be the dedicated project's legacy service_role JWT.",
  );
  assert.ok(
    IS_ISOLATED_TEST_DB_CONFIGURED,
    `Explicit integration test failure: configure the exact test URL and matching anon/service_role JWTs for ${PRIMARY_SUPABASE_URL}.`,
  );
}

function createAnonClient(url: string, anonKey: string): SupabaseClient {
  assertPrimaryProjectTestEnvironment();
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

// ============================================================================
// PART A: Migration SQL Security Validation & Dedicated Test DB Privilege Verification
// ============================================================================

test("Part A.0: Migration 20261031071500 & schema.sql fix 42P01 pg_catalog.current_user bug, enforce SECURITY INVOKER ownership trigger, and harden grants", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase/migrations/20261031071500_add_families_and_users_insert_rls_for_upsert.sql",
  );
  const schemaPath = path.resolve(process.cwd(), "supabase/schema.sql");

  const migrationSql = fs.readFileSync(migrationPath, "utf8");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  for (const [label, sqlText] of [
    ["20261031071500 migration", migrationSql],
    ["supabase/schema.sql", schemaSql],
  ] as const) {
    assert.equal(
      /pg_catalog\.current_user/i.test(sqlText),
      false,
      `${label} must not contain invalid 'pg_catalog.current_user' (causes PostgreSQL 42P01)`,
    );
    assert.equal(
      /pg_catalog\.session_user/i.test(sqlText),
      false,
      `${label} must not contain invalid 'pg_catalog.session_user'`,
    );
    assert.match(
      sqlText,
      /CREATE OR REPLACE FUNCTION private\.prevent_ownership_column_mutation\(\)\s+RETURNS TRIGGER\s+LANGUAGE plpgsql\s+SECURITY INVOKER\s+SET search_path = ''/i,
      `${label} must define private.prevent_ownership_column_mutation() as SECURITY INVOKER with SET search_path = ''`,
    );
    assert.match(
      sqlText,
      /CURRENT_USER IN \('anon', 'authenticated', 'authenticator'\)/,
      `${label} must verify CURRENT_USER IN ('anon', 'authenticated', 'authenticator') inside prevent_ownership_column_mutation`,
    );
    assert.match(
      sqlText,
      /GRANT EXECUTE ON FUNCTION private\.prevent_ownership_column_mutation\(\) TO authenticated, service_role;/,
      `${label} must grant EXECUTE on trigger function prevent_ownership_column_mutation to authenticated, service_role`,
    );
    assert.match(
      sqlText,
      /GRANT EXECUTE ON FUNCTION private\.enforce_child_belongs_to_family\(\) TO authenticated, service_role;/,
      `${label} must grant EXECUTE on trigger function enforce_child_belongs_to_family to authenticated, service_role`,
    );
    assert.match(
      sqlText,
      /GRANT EXECUTE ON FUNCTION private\.create_default_family_home\(\) TO authenticated, service_role;/,
      `${label} must grant EXECUTE on trigger function create_default_family_home to authenticated, service_role`,
    );
  }
});

test("Part A.1: Primary Supabase PostgreSQL (qbwnzunusmaidciakuod) denies anonymous SELECT, INSERT, UPDATE, and DELETE on all private family tables", async () => {
  const anonClient = createAnonClient(TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY);

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
      `Expected SQLSTATE 42501 on anonymous SELECT from public.${table} on primary project ${PRIMARY_PROJECT_REF}, got [${selectRes.error?.code}]: ${selectRes.error?.message}`,
    );
  }
});

test("Part A.2: Primary Supabase PostgreSQL (qbwnzunusmaidciakuod) allows anonymous SELECT on catalog_items and denies anonymous INSERT, UPDATE, and DELETE", async () => {
  const anonClient = createAnonClient(TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY);

  const selectRes = await anonClient
    .from("catalog_items")
    .select("id, title, category")
    .limit(3);
  assert.equal(
    selectRes.error,
    null,
    `Expected anonymous SELECT on catalog_items to succeed on primary project ${PRIMARY_PROJECT_REF}, got [${selectRes.error?.code}]: ${selectRes.error?.message}`,
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

test("Part A.3: Primary Supabase PostgreSQL (qbwnzunusmaidciakuod) denies anonymous RPC execution on bootstrap_authenticated_family_space and accept_family_invitation", async () => {
  const anonClient = createAnonClient(TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY);

  const bootstrapRes = await anonClient.rpc(
    "bootstrap_authenticated_family_space",
    {
      p_family_name: "Anon Attempt",
      p_country: "EG",
      p_full_name: "Anon User",
      p_role: "father",
    },
  );
  assert.ok(
    bootstrapRes.error,
    "Expected anonymous bootstrap_authenticated_family_space RPC to fail",
  );
  assert.equal(
    bootstrapRes.error?.code,
    "42501",
    `Expected SQLSTATE 42501 on anonymous bootstrap_authenticated_family_space RPC on primary project ${PRIMARY_PROJECT_REF}, got [${bootstrapRes.error?.code}]: ${bootstrapRes.error?.message}`,
  );

  const acceptRes = await anonClient.rpc("accept_family_invitation", {
    p_token_hash: "0".repeat(64),
  });
  assert.ok(
    acceptRes.error,
    "Expected anonymous accept_family_invitation RPC to fail",
  );
  assert.equal(
    acceptRes.error?.code,
    "42501",
    `Expected SQLSTATE 42501 on anonymous accept_family_invitation RPC on primary project ${PRIMARY_PROJECT_REF}, got [${acceptRes.error?.code}]: ${acceptRes.error?.message}`,
  );
});

test("Part A.4: Dedicated test environment security, .gitignore hygiene, and 22-Arab-League-countries SQL schema/migration verification", () => {
  const gitignoreText = fs.readFileSync(
    path.resolve(process.cwd(), ".gitignore"),
    "utf8",
  );
  for (const requiredIgnore of [".env", ".env.local", ".env.test"]) {
    assert.ok(
      gitignoreText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .includes(requiredIgnore),
      `.gitignore must explicitly ignore ${requiredIgnore}`,
    );
  }

  const envExampleText = fs.readFileSync(
    path.resolve(process.cwd(), ".env.example"),
    "utf8",
  );
  assert.ok(
    envExampleText.includes("https://hbnxaqoaoeqaetvgbkgb.supabase.co"),
    ".env.example must document the primary Supabase project URL https://hbnxaqoaoeqaetvgbkgb.supabase.co",
  );
  assert.ok(
    envExampleText.includes("region: ap-south-1"),
    ".env.example must document the primary Supabase project region as ap-south-1",
  );
  assert.ok(
    envExampleText.includes("TEST_SUPABASE_ANON_KEY") &&
      envExampleText.includes("TEST_SUPABASE_SERVICE_ROLE_KEY"),
    ".env.example must document TEST_SUPABASE_ANON_KEY and TEST_SUPABASE_SERVICE_ROLE_KEY",
  );
  assert.equal(
    /VITE_.*SERVICE_ROLE/i.test(envExampleText),
    false,
    ".env.example must never expose service_role in VITE_ variables",
  );

  // Verify 22 Arab League countries, currencies, and required RPCs in schema.sql and 20261031120000 migration
  const schemaSql = fs.readFileSync(
    path.resolve(process.cwd(), "supabase/schema.sql"),
    "utf8",
  );
  const countriesMigrationSql = fs.readFileSync(
    path.resolve(
      process.cwd(),
      "supabase/migrations/20261031120000_support_all_22_arab_league_countries.sql",
    ),
    "utf8",
  );

  assert.ok(
    schemaSql.includes("CREATE OR REPLACE FUNCTION public.bootstrap_authenticated_family_space") &&
      schemaSql.includes("CREATE OR REPLACE FUNCTION public.accept_family_invitation"),
    "supabase/schema.sql must define public.bootstrap_authenticated_family_space and public.accept_family_invitation RPCs",
  );

  for (const code of ALL_ARAB_COUNTRY_CODES) {
    assert.ok(
      schemaSql.includes(`'${code}'`),
      `supabase/schema.sql must support Arab League country code '${code}'`,
    );
    assert.ok(
      countriesMigrationSql.includes(`'${code}'`),
      `20261031120000 migration must support Arab League country code '${code}'`,
    );
  }

  for (const currency of ALL_ARAB_CURRENCIES) {
    assert.ok(
      schemaSql.includes(`'${currency}'`),
      `supabase/schema.sql must support Arab League currency '${currency}'`,
    );
    assert.ok(
      countriesMigrationSql.includes(`'${currency}'`),
      `20261031120000 migration must support Arab League currency '${currency}'`,
    );
  }
});

// ============================================================================
// PART B: Full 17-Scenario Authenticated Multi-Family PostgreSQL RLS Matrix
// (Runs against the primary Supabase project qbwnzunusmaidciakuod)
// ============================================================================

test(
  "Part B: Full 17-scenario authenticated multi-family PostgreSQL RLS & Storage integration suite",
  async () => {
    assert.ok(
      IS_ISOLATED_TEST_DB_CONFIGURED,
      `Explicit integration test failure: TEST_SUPABASE_URL (${TEST_SUPABASE_URL || "unset"}), TEST_SUPABASE_ANON_KEY, and TEST_SUPABASE_SERVICE_ROLE_KEY must be configured for the primary Supabase project (${PRIMARY_PROJECT_REF}). Missing test environment configuration must fail explicitly rather than skip.`,
    );
    assert.ok(
      TEST_SUPABASE_URL.includes(PRIMARY_PROJECT_REF) &&
        !TEST_SUPABASE_URL.includes("qbwnzunusmaidciakuod"),
      `Explicit safety failure: Integration tests must target only the primary Supabase project (${PRIMARY_PROJECT_REF}) and must match the primary project.`,
    );

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
    const createdFamilyIds: string[] = [];
    const createdStoragePaths: string[] = [];

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
      partnerRole: "father" | "mother",
    ) {
      const token = generateSecureFamilyPairingToken();
      const tokenHash = await hashFamilyPairingToken(token);
      const { error } = await client.from("co_parent_pairings").insert({
        family_id: familyId,
        invited_by_user_id: invitedByUserId,
        partner_name: "Nekbaar Test Invitee",
        partner_phone: "",
        partner_email: partnerEmail.toLowerCase(),
        partner_role: partnerRole,
        pairing_method: "qr_token",
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
      // Missing tables, RPCs (such as PGRST202), or permissions MUST cause an explicit test failure.
      const bootA = await parentA.client.rpc("bootstrap_authenticated_family_space", {
        p_family_name: "Family A",
        p_country: "EG",
        p_full_name: "Parent A",
        p_role: "father",
      });

      assert.equal(
        bootA.error,
        null,
        `Explicit failure calling public.bootstrap_authenticated_family_space on primary project ${PRIMARY_PROJECT_REF}: [${bootA.error?.code ?? "ERROR"}] ${bootA.error?.message ?? "Unknown RPC error"}. Ensure supabase/schema.sql and all migrations in supabase/migrations/ are applied to primary project ${PRIMARY_PROJECT_REF}.`,
      );
      const familyAId: string = Array.isArray(bootA.data)
        ? bootA.data[0]?.family_id
        : bootA.data?.family_id;
      assert.ok(
        familyAId,
        "bootstrap_authenticated_family_space must return a valid family_id for Family A",
      );
      createdFamilyIds.push(familyAId);
      const parentAProfileId: string = Array.isArray(bootA.data)
        ? bootA.data[0]?.user_id
        : bootA.data?.user_id;
      assert.ok(parentAProfileId, "Family A bootstrap must return the public.users profile user_id");

      const bootB = await parentB.client.rpc("bootstrap_authenticated_family_space", {
        p_family_name: "Family B",
        p_country: "EG",
        p_full_name: "Parent B",
        p_role: "mother",
      });
      assert.equal(
        bootB.error,
        null,
        `Explicit failure calling public.bootstrap_authenticated_family_space for Family B: [${bootB.error?.code ?? "ERROR"}] ${bootB.error?.message ?? "Unknown RPC error"}`,
      );
      const familyBId: string = Array.isArray(bootB.data)
        ? bootB.data[0]?.family_id
        : bootB.data?.family_id;
      assert.ok(
        familyBId,
        "bootstrap_authenticated_family_space must return a valid family_id for Family B",
      );
      createdFamilyIds.push(familyBId);
      const parentBProfileId: string = Array.isArray(bootB.data)
        ? bootB.data[0]?.user_id
        : bootB.data?.user_id;
      assert.ok(parentBProfileId, "Family B bootstrap must return the public.users profile user_id");

      // Every invitee must have a verified profile and an empty placeholder family before accepting.
      const bootUnlinked = await inviteeUnlinked.client.rpc("bootstrap_authenticated_family_space", {
        p_family_name: "Unlinked Placeholder",
        p_country: "EG",
        p_full_name: "Unlinked Invitee",
        p_role: "mother",
      });
      assert.equal(bootUnlinked.error, null, bootUnlinked.error?.message);
      const unlinkedFamilyId: string = Array.isArray(bootUnlinked.data)
        ? bootUnlinked.data[0]?.family_id
        : bootUnlinked.data?.family_id;
      assert.ok(unlinkedFamilyId, "Unlinked invitee bootstrap must return a placeholder family_id");
      createdFamilyIds.push(unlinkedFamilyId);

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
          birth: "2020-04-10",
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
          birth: "2021-08-15",
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
          birth: "2022-01-01",
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
        .eq("id", parentAProfileId);
      assert.ok(
        hijackFamilyErr,
        "Direct UPDATE of users.family_id must be rejected by trigger/RLS",
      );

      // 7. Parent A cannot insert or update a row with another user's auth_user_id
      const { error: impersonateErr } = await parentA.client.from("users").upsert({
        id: parentBProfileId,
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
            id: parentAProfileId,
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
            id: parentAProfileId,
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
        parentAProfileId,
        emailInviteUnlinked,
        "mother",
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
          p_country: "EG",
          p_full_name: "Solo Invitee",
          p_role: "father",
        },
      );
      assert.equal(bootSolo.error, null, bootSolo.error?.message);
      const soloFamilyId: string = Array.isArray(bootSolo.data)
        ? bootSolo.data[0]?.family_id
        : bootSolo.data?.family_id;
      assert.ok(soloFamilyId, "Solo invitee bootstrap must return a family ID");
      createdFamilyIds.push(soloFamilyId);
      const soloProfileId: string = Array.isArray(bootSolo.data)
        ? bootSolo.data[0]?.user_id
        : bootSolo.data?.user_id;
      assert.ok(soloProfileId, "Solo invitee bootstrap must return a profile ID");

      const tokenSolo = await createPairingInvitation(
        parentB.client,
        familyBId,
        parentBProfileId,
        emailInviteSolo,
        "father",
      );
      const acceptSolo = await acceptFamilyInvitation(tokenSolo, inviteeSolo.client);
      assert.equal(acceptSolo.accepted, true, acceptSolo.error || "Expected solo transfer");
      assert.equal(acceptSolo.familyId, familyBId);

      // 15. Account whose family has children/data cannot transfer families
      const tokenNonEmpty = await createPairingInvitation(
        parentB.client,
        familyBId,
        parentBProfileId,
        emailA,
        "father",
      );
      const nonEmptyRes = await acceptFamilyInvitation(tokenNonEmpty, parentA.client);
      assert.equal(nonEmptyRes.accepted, false);
      assert.match(String(nonEmptyRes.error), /FAMILY_DATA_EXISTS/i);

      // 16 & 17. Private storage is isolated between families; cross-family signed URL fails
      const objectPath = `${familyAId}/albums/${childA!.id}/first-step.jpg`;
      createdStoragePaths.push(objectPath);
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
      const cleanupErrors: string[] = [];

      if (createdStoragePaths.length > 0) {
        const { error } = await adminClient.storage.from("family-media").remove(createdStoragePaths);
        if (error) cleanupErrors.push(`Storage cleanup failed: ${error.message}`);
      }

      if (createdFamilyIds.length > 0) {
        const { error } = await adminClient
          .from("co_parent_pairings")
          .delete()
          .in("family_id", [...new Set(createdFamilyIds)]);
        if (error) cleanupErrors.push(`Invitation cleanup failed: ${error.message}`);
      }

      if (createdAuthUserIds.length > 0) {
        const { error } = await adminClient
          .from("users")
          .delete()
          .in("auth_user_id", createdAuthUserIds);
        if (error) cleanupErrors.push(`Profile cleanup failed: ${error.message}`);
      }

      if (createdFamilyIds.length > 0) {
        const { error } = await adminClient
          .from("families")
          .delete()
          .in("id", [...new Set(createdFamilyIds)]);
        if (error) cleanupErrors.push(`Family data cleanup failed: ${error.message}`);
      }

      for (const uid of createdAuthUserIds) {
        const { error } = await adminClient.auth.admin.deleteUser(uid);
        if (error) cleanupErrors.push(`Auth user cleanup failed for ${uid}: ${error.message}`);
      }

      assert.equal(cleanupErrors.length, 0, cleanupErrors.join("; "));
    }
  },
);
