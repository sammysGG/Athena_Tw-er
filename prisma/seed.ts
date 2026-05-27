import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type SeedUser = {
  username: string;
  email: string;
  displayName: string;
  password: string;
  role?: "admin" | "user";
  bio?: string;
  gender?: string;
  location?: string;
  website?: string;
  avatarStyle?: string; // dicebear style key
  avatarSeed?: string; // override seed (defaults to username)
};

function dicebearUrl(style: string, seed: string): string {
  // Dicebear v9 — deterministic SVG avatars, no API key.
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

const SEED_USERS: SeedUser[] = [
  {
    username: "admin",
    email: "admin@twater.local",
    displayName: "Tw@er Admin",
    password: "Cool2Pass",
    role: "admin",
    bio: "Platform admin account. God-mode by default.",
    gender: "prefer_not_to_say",
    location: "Server room",
    avatarStyle: "shapes",
    avatarSeed: "twater-admin",
  },
  {
    username: "twater_news",
    email: "news@twater.local",
    displayName: "Tw@er News",
    password: "newsdesk22",
    bio: "Aggregating reporting on the Estonia–Donovia situation. Posts are summaries, not endorsements.",
    location: "Tallinn, Estonia",
    website: "https://example.org/news",
    avatarStyle: "icons",
    avatarSeed: "news-network",
  },
  {
    username: "donoviadabest",
    email: "patriot@donovia.local",
    displayName: "Donovia Da Best 🇩🇴",
    password: "donovia4ever",
    bio: "Loyal son of the Motherland. Truth from the people of Donovia. The western lies will not stand!",
    gender: "male",
    location: "Donovia",
    avatarStyle: "avataaars",
    avatarSeed: "viktor-donov",
  },
  {
    username: "natowatch",
    email: "watch@nato.local",
    displayName: "NATO Watch",
    password: "natoanalyst",
    bio: "Open-source analyst tracking NATO posture in the Baltic.",
    location: "Brussels",
    avatarStyle: "shapes",
    avatarSeed: "nato-blue",
  },
  {
    username: "ariana_volkov",
    email: "ariana@example.com",
    displayName: "Ariana Volkov",
    password: "passw0rd",
    bio: "Cyber threat researcher. Estonia-based. Caffeine-fueled.",
    gender: "female",
    location: "Tallinn",
    avatarStyle: "avataaars",
  },
  {
    username: "cpt_harding",
    email: "harding@example.com",
    displayName: "Cpt. J. Harding (Ret.)",
    password: "passw0rd",
    bio: "Former British Forces. Commentary on sub-threshold warfare in the Baltic.",
    gender: "male",
    location: "Tallinn / London",
    avatarStyle: "avataaars",
  },
  {
    username: "tallinnportwatch",
    email: "portwatch@example.com",
    displayName: "Tallinn Port Watch",
    password: "passw0rd",
    bio: "Citizen-run watch on shipping movements at Tallinn Port.",
    location: "Tallinn, Estonia",
    avatarStyle: "icons",
    avatarSeed: "port-anchor",
  },
  {
    username: "greyzonegirl",
    email: "greyzone@example.com",
    displayName: "Greyzone Girl",
    password: "passw0rd",
    bio: "Reading too much about hybrid threats. Posting too little.",
    gender: "female",
    avatarStyle: "avataaars",
  },
  {
    username: "us_baltic_obs",
    email: "obs@example.com",
    displayName: "US Baltic Observer",
    password: "passw0rd",
    bio: "Tracking US Forces rotations into the Baltic States.",
    location: "Washington, DC",
    avatarStyle: "avataaars",
  },
  {
    username: "kalev_estonian",
    email: "kalev@example.com",
    displayName: "Kalev",
    password: "passw0rd",
    bio: "Estonian, IT guy, occasional reservist.",
    gender: "male",
    location: "Tartu, Estonia",
    avatarStyle: "avataaars",
  },
];

type SeedPost = {
  authorUsername: string;
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  pinned?: boolean;
};

const SEED_POSTS: SeedPost[] = [
  {
    authorUsername: "admin",
    content: "Welcome to Tw@er — the mock social feed for scenario play. Be civil, be sceptical, and have fun.",
    pinned: true,
  },

  // Donovia propaganda
  {
    authorUsername: "donoviadabest",
    content:
      "The leader of Donovia has said it plainly: Donovia will not back down from western aggression. We will not be lectured by NATO. 🇩🇴",
  },
  {
    authorUsername: "donoviadabest",
    content:
      "The so-called 'British Forces' presence in Estonia is provocation. We are not the aggressors — they are the ones on our doorstep.",
  },
  {
    authorUsername: "donoviadabest",
    content:
      "Western media keeps crying 'greyzone, greyzone, sub-threshold warfare!' but it is they who hack our systems and blockade our trade. Wake up.",
  },
  {
    authorUsername: "donoviadabest",
    content:
      "Reminder: Tallinn port was built on Donovian sweat in the old days. We have no quarrel with the Estonian people — only with their NATO handlers.",
  },

  // News account
  {
    authorUsername: "twater_news",
    content:
      "Statement from the Donovian presidency: 'Donovia will not back down from western aggression.' Estonian foreign ministry: 'rhetoric, not policy — but we are watching closely.'",
  },
  {
    authorUsername: "twater_news",
    content:
      "Estonia raises CERT alert level after a wave of low-grade DDoS attempts against municipal portals overnight. No service impact reported. Attribution pending.",
  },
  {
    authorUsername: "twater_news",
    content:
      "Two additional British Forces convoys observed transiting toward Tapa overnight. NATO Watch describes the movement as 'consistent with a scheduled rotation, not a surge'.",
  },
  {
    authorUsername: "twater_news",
    content:
      "Tallinn Port operations normal. Harbour Master confirms no shipping has been turned away. Two Donovian-flagged tankers remain at anchor outside the inner harbour awaiting paperwork.",
  },

  // Cyber / greyzone chatter
  {
    authorUsername: "ariana_volkov",
    content:
      "Spike in credential-stuffing against Estonian local-government SSO this morning. Pattern looks rehearsal-y, not destructive. Classic sub-threshold warfare playbook.",
  },
  {
    authorUsername: "ariana_volkov",
    content:
      "If you work for an Estonian municipality and your inbox is full of 'urgent invoice' PDFs today — yes, that is the campaign. MFA on, please. 🙏 #cyber",
  },
  {
    authorUsername: "greyzonegirl",
    content:
      "The thing people miss about greyzone operations is that nothing single act crosses a redline. It is the *aggregate* that crosses it, and by then you are arguing about which straw broke the camel.",
  },

  // British / US forces
  {
    authorUsername: "cpt_harding",
    content:
      "Watching the British Forces lads roll through Tartu this morning. Same kit, same scheduled rotation — the panic posts you are seeing are not informed.",
  },
  {
    authorUsername: "us_baltic_obs",
    content:
      "US Forces have confirmed a small uplift in liaison personnel to HQ Tapa. Officially: 'routine'. Practically: somebody wants more eyes on the Donovian border. Both can be true.",
  },
  {
    authorUsername: "natowatch",
    content:
      "Reading guide for new followers: when Donovian officials say 'we will not back down', that is for domestic consumption. Their actual signal is in the movement of their northern fleet — and right now, that has not moved.",
  },

  // Tallinn port chatter
  {
    authorUsername: "tallinnportwatch",
    content:
      "Two Donovian-flagged tankers riding at anchor outside Tallinn port for 36+ hours now. Harbour Master says 'paperwork'. Vessels appear loaded. Worth watching.",
  },
  {
    authorUsername: "kalev_estonian",
    content:
      "My cousin works at Tallinn port. Says everything is normal except half the supervisors are suddenly very, very chatty with men in suits. Make of that what you will.",
  },

  // General Estonia + Ariana
  {
    authorUsername: "ariana_volkov",
    content:
      "Reminder, since this keeps coming up: 'Ariana' is the *call-sign* used in the joint Estonia/NATO exercise series. It is not a person. (I just have the misfortune of sharing the name.)",
  },
  {
    authorUsername: "kalev_estonian",
    content:
      "Public service announcement: a Donovian state-aligned account is mass-replying to every #Estonia post tonight. Mute, don't engage. It is rage-bait by design.",
  },
];

async function main() {
  // Users
  const userIdByUsername = new Map<string, string>();
  for (const u of SEED_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const avatarUrl = dicebearUrl(u.avatarStyle ?? "avataaars", u.avatarSeed ?? u.username);
    const created = await prisma.user.upsert({
      where: { username: u.username },
      update: {
        displayName: u.displayName,
        bio: u.bio,
        gender: u.gender,
        location: u.location,
        website: u.website,
        role: u.role ?? "user",
        avatarUrl,
      },
      create: {
        username: u.username,
        email: u.email,
        displayName: u.displayName,
        passwordHash,
        role: u.role ?? "user",
        bio: u.bio,
        gender: u.gender,
        location: u.location,
        website: u.website,
        avatarUrl,
      },
    });
    userIdByUsername.set(u.username, created.id);
    console.log(`✓ user @${u.username} (${created.id})`);
  }

  // Wipe scenario posts before reseeding so re-runs stay clean.
  await prisma.post.deleteMany({
    where: { author: { username: { in: SEED_USERS.map((u) => u.username) } } },
  });

  // Posts (with slightly jittered timestamps so the feed has variety)
  const now = Date.now();
  for (let i = 0; i < SEED_POSTS.length; i++) {
    const p = SEED_POSTS[i];
    const authorId = userIdByUsername.get(p.authorUsername);
    if (!authorId) continue;
    // newest at index 0; spread back over ~3 days
    const ageMinutes = i * (60 * 24 * 3) / SEED_POSTS.length + Math.random() * 30;
    const createdAt = new Date(now - ageMinutes * 60 * 1000);
    await prisma.post.create({
      data: {
        content: p.content,
        authorId,
        mediaUrl: p.mediaUrl,
        mediaType: p.mediaType,
        pinnedAt: p.pinned ? createdAt : null,
        createdAt,
      },
    });
  }
  console.log(`✓ inserted ${SEED_POSTS.length} posts`);

  // A handful of random likes & comments for realism
  const allUsers = await prisma.user.findMany({ select: { id: true } });
  const allPosts = await prisma.post.findMany({ select: { id: true } });
  let likes = 0;
  for (const u of allUsers) {
    for (const post of allPosts) {
      if (Math.random() < 0.25) {
        await prisma.like
          .create({ data: { userId: u.id, postId: post.id } })
          .then(() => likes++)
          .catch(() => {});
      }
    }
  }
  console.log(`✓ ${likes} likes`);

  const sampleComments = [
    "👀",
    "this is the part the timeline keeps glossing over",
    "source?",
    "agree, with caveats",
    "we are watching",
    "🇪🇪🇪🇪",
    "Donovia is bluffing imo",
    "let cooler heads prevail",
  ];
  let comments = 0;
  for (const post of allPosts) {
    const n = Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const u = allUsers[Math.floor(Math.random() * allUsers.length)];
      await prisma.comment.create({
        data: {
          postId: post.id,
          userId: u.id,
          content: sampleComments[Math.floor(Math.random() * sampleComments.length)],
        },
      });
      comments++;
    }
  }
  console.log(`✓ ${comments} comments`);

  // Default chat rooms — upsert so reseeds keep them stable.
  const adminId = userIdByUsername.get("admin");
  if (adminId) {
    const defaultRooms = [
      { slug: "general", name: "General", description: "Open chat. Be civil." },
      {
        slug: "estonia-news",
        name: "Estonia news",
        description: "Live discussion of breaking news from Estonia and the Baltic.",
      },
      {
        slug: "cyber",
        name: "Cyber chatter",
        description: "Incident notes, IOC sharing, defender talk.",
      },
    ];
    for (const r of defaultRooms) {
      await prisma.chatRoom.upsert({
        where: { slug: r.slug },
        update: { name: r.name, description: r.description },
        create: { ...r, createdById: adminId },
      });
    }
    console.log(`✓ ${defaultRooms.length} default rooms`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
