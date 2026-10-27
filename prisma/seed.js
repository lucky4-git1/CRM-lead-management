const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Cleaning existing database tables ---');
  await prisma.auditLog.deleteMany({});
  await prisma.automationExecutionLog.deleteMany({});
  await prisma.automationRule.deleteMany({});
  await prisma.leadScoringLog.deleteMany({});
  await prisma.leadScoringRule.deleteMany({});
  await prisma.leadAssignmentRule.deleteMany({});
  await prisma.interaction.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.deal.deleteMany({});
  await prisma.pipelineStage.deleteMany({});
  await prisma.pipeline.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.leadCaptureForm.deleteMany({});
  await prisma.integrationAccount.deleteMany({});
  await prisma.teamMember.deleteMany({});
  await prisma.membership.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});

  console.log('--- Creating Organization ---');
  const org = await prisma.organization.create({
    data: {
      name: 'Acme Enterprise Solutions',
      slug: 'acme',
      timezone: 'America/New_York',
      currency: 'USD',
      settings: {
        allowRegistration: true,
        enforceMFA: false,
        leadScoringEnabled: true,
      },
    },
  });

  console.log('--- Creating Users ---');
  const passwordHash = await bcrypt.hash('password123', 10);

  const owner = await prisma.user.create({
    data: {
      email: 'admin@acme.com',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Connor',
      phone: '+1-555-0101',
      isActive: true,
      memberships: {
        create: {
          organizationId: org.id,
          role: 'OWNER',
        },
      },
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'marcus.manager@acme.com',
      passwordHash,
      firstName: 'Marcus',
      lastName: 'Vance',
      phone: '+1-555-0102',
      isActive: true,
      memberships: {
        create: {
          organizationId: org.id,
          role: 'SALES_MANAGER',
        },
      },
    },
  });

  const rep1 = await prisma.user.create({
    data: {
      email: 'alex.rep@acme.com',
      passwordHash,
      firstName: 'Alex',
      lastName: 'Mercer',
      phone: '+1-555-0103',
      isActive: true,
      memberships: {
        create: {
          organizationId: org.id,
          role: 'SALES_REP',
        },
      },
    },
  });

  const rep2 = await prisma.user.create({
    data: {
      email: 'elena.rodriguez@acme.com',
      passwordHash,
      firstName: 'Elena',
      lastName: 'Rodriguez',
      phone: '+1-555-0104',
      isActive: true,
      memberships: {
        create: {
          organizationId: org.id,
          role: 'SALES_REP',
        },
      },
    },
  });

  const marketing = await prisma.user.create({
    data: {
      email: 'david.marketing@acme.com',
      passwordHash,
      firstName: 'David',
      lastName: 'Kim',
      phone: '+1-555-0105',
      isActive: true,
      memberships: {
        create: {
          organizationId: org.id,
          role: 'MARKETING',
        },
      },
    },
  });

  console.log('--- Creating Teams ---');
  const enterpriseTeam = await prisma.team.create({
    data: {
      organizationId: org.id,
      name: 'Enterprise Accounts',
      description: 'Focuses on Tier 1 strategic enterprise leads',
      leaderId: manager.id,
      teamMembers: {
        create: [
          { userId: rep1.id },
          { userId: rep2.id },
        ],
      },
    },
  });

  console.log('--- Creating Pipeline and Stages ---');
  const pipeline = await prisma.pipeline.create({
    data: {
      organizationId: org.id,
      name: 'Standard B2B Sales Pipeline',
      isDefault: true,
      stages: {
        create: [
          { name: 'New Lead', stageOrder: 1, winProbability: 10, color: '#3b82f6' },
          { name: 'Contacted', stageOrder: 2, winProbability: 25, color: '#6366f1' },
          { name: 'Discovery / Demo', stageOrder: 3, winProbability: 40, color: '#8b5cf6' },
          { name: 'Proposal Sent', stageOrder: 4, winProbability: 60, color: '#ec4899' },
          { name: 'Negotiation', stageOrder: 5, winProbability: 80, color: '#f59e0b' },
          { name: 'Closed Won', stageOrder: 6, winProbability: 100, color: '#10b981', isWon: true },
          { name: 'Closed Lost', stageOrder: 7, winProbability: 0, color: '#ef4444', isLost: true },
        ],
      },
    },
    include: { stages: true },
  });

  const stageMap = {};
  for (const s of pipeline.stages) {
    stageMap[s.name] = s.id;
  }

  console.log('--- Creating Companies ---');
  const comp1 = await prisma.company.create({
    data: {
      organizationId: org.id,
      name: 'Vertex Cloud Technologies',
      domain: 'vertexcloud.io',
      industry: 'Cloud Infrastructure',
      size: '250-500',
      website: 'https://vertexcloud.io',
      phone: '+1-415-555-9011',
      address: '100 Market Street, Suite 400',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      annualRevenue: 45000000,
      totalOpportunityValue: 125000,
      ownerId: rep1.id,
    },
  });

  const comp2 = await prisma.company.create({
    data: {
      organizationId: org.id,
      name: 'Nexus BioHealth Systems',
      domain: 'nexusbiohealth.com',
      industry: 'Healthcare Technology',
      size: '1000+',
      website: 'https://nexusbiohealth.com',
      phone: '+1-617-555-4422',
      address: '500 Technology Square',
      city: 'Cambridge',
      state: 'MA',
      country: 'USA',
      annualRevenue: 120000000,
      totalOpportunityValue: 240000,
      ownerId: rep2.id,
    },
  });

  const comp3 = await prisma.company.create({
    data: {
      organizationId: org.id,
      name: 'Starlight Financial Analytics',
      domain: 'starlightfin.com',
      industry: 'FinTech',
      size: '50-100',
      website: 'https://starlightfin.com',
      phone: '+1-212-555-8833',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      annualRevenue: 18000000,
      totalOpportunityValue: 65000,
      ownerId: rep1.id,
    },
  });

  console.log('--- Creating Contacts ---');
  const contact1 = await prisma.contact.create({
    data: {
      organizationId: org.id,
      companyId: comp1.id,
      firstName: 'Daniel',
      lastName: 'Sterling',
      email: 'daniel.sterling@vertexcloud.io',
      phone: '+1-415-555-9012',
      jobTitle: 'VP of Engineering',
      department: 'Engineering',
      isPrimary: true,
      lifecycleStage: 'OPPORTUNITY',
      ownerId: rep1.id,
    },
  });

  const contact2 = await prisma.contact.create({
    data: {
      organizationId: org.id,
      companyId: comp2.id,
      firstName: 'Dr. Evelyn',
      lastName: 'Reed',
      email: 'evelyn.reed@nexusbiohealth.com',
      phone: '+1-617-555-4423',
      jobTitle: 'Chief Medical Information Officer',
      department: 'Clinical Operations',
      isPrimary: true,
      lifecycleStage: 'CUSTOMER',
      ownerId: rep2.id,
    },
  });

  const contact3 = await prisma.contact.create({
    data: {
      organizationId: org.id,
      companyId: comp3.id,
      firstName: 'Chloe',
      lastName: 'Zhao',
      email: 'chloe.zhao@starlightfin.com',
      phone: '+1-212-555-8834',
      jobTitle: 'Head of Quant Analytics',
      isPrimary: true,
      lifecycleStage: 'LEAD',
      ownerId: rep1.id,
    },
  });

  console.log('--- Creating Deals ---');
  const deal1 = await prisma.deal.create({
    data: {
      organizationId: org.id,
      pipelineId: pipeline.id,
      stageId: stageMap['Proposal Sent'],
      title: 'Vertex Cloud - Enterprise Platform Migration',
      amount: 125000,
      probability: 60,
      expectedCloseDate: new Date(Date.now() + 25 * 86400000),
      ownerId: rep1.id,
      contactId: contact1.id,
      companyId: comp1.id,
      status: 'OPEN',
    },
  });

  const deal2 = await prisma.deal.create({
    data: {
      organizationId: org.id,
      pipelineId: pipeline.id,
      stageId: stageMap['Closed Won'],
      title: 'Nexus BioHealth - Compliance & Analytics Suite',
      amount: 240000,
      probability: 100,
      expectedCloseDate: new Date(Date.now() - 5 * 86400000),
      closedAt: new Date(Date.now() - 5 * 86400000),
      ownerId: rep2.id,
      contactId: contact2.id,
      companyId: comp2.id,
      status: 'WON',
    },
  });

  const deal3 = await prisma.deal.create({
    data: {
      organizationId: org.id,
      pipelineId: pipeline.id,
      stageId: stageMap['Discovery / Demo'],
      title: 'Starlight Fin - Risk Modeling Workflow',
      amount: 65000,
      probability: 40,
      expectedCloseDate: new Date(Date.now() + 45 * 86400000),
      ownerId: rep1.id,
      contactId: contact3.id,
      companyId: comp3.id,
      status: 'OPEN',
    },
  });

  const deal4 = await prisma.deal.create({
    data: {
      organizationId: org.id,
      pipelineId: pipeline.id,
      stageId: stageMap['Negotiation'],
      title: 'OmniGlobal Retail - Supply Chain Automation',
      amount: 88000,
      probability: 80,
      expectedCloseDate: new Date(Date.now() + 10 * 86400000),
      ownerId: rep2.id,
      status: 'OPEN',
    },
  });

  console.log('--- Creating Leads ---');
  const leadsData = [
    {
      firstName: 'Robert',
      lastName: 'Chen',
      email: 'robert.chen@apextechnologies.com',
      phone: '+1-408-555-0188',
      whatsapp: '+1-408-555-0188',
      companyName: 'Apex Technologies',
      jobTitle: 'VP of Product',
      website: 'https://apextechnologies.com',
      industry: 'Enterprise Software',
      city: 'San Jose',
      state: 'CA',
      country: 'USA',
      source: 'WEBSITE',
      sourceCampaign: 'Q4 Enterprise Demo Request',
      sourceChannel: 'organic_search',
      ownerId: rep1.id,
      teamId: enterpriseTeam.id,
      status: 'QUALIFIED',
      qualificationScore: 85,
      priority: 'HIGH',
      interestedProduct: 'Enterprise CRM Suite',
      estimatedValue: 95000,
      expectedPurchaseDate: new Date(Date.now() + 30 * 86400000),
      tags: ['enterprise', 'high-priority', 'inbound-demo'],
      notes: 'Requested customized demo for 150 sales seats. Very high urgency for next quarter.',
      consentGiven: true,
      nextFollowUpAt: new Date(Date.now() + 1 * 86400000),
      lastContactAt: new Date(Date.now() - 1 * 86400000),
    },
    {
      firstName: 'Sophia',
      lastName: 'Martinez',
      email: 'smartinez@luminaenergy.org',
      phone: '+1-713-555-0199',
      whatsapp: '+1-713-555-0199',
      companyName: 'Lumina Clean Energy',
      jobTitle: 'Operations Director',
      website: 'https://luminaenergy.org',
      industry: 'Clean Energy & Utilities',
      city: 'Houston',
      state: 'TX',
      country: 'USA',
      source: 'WHATSAPP',
      sourceCampaign: 'WhatsApp Business Inbound',
      sourceChannel: 'chat_widget',
      ownerId: rep2.id,
      teamId: enterpriseTeam.id,
      status: 'CONTACTED',
      qualificationScore: 72,
      priority: 'MEDIUM',
      interestedProduct: 'Lead Management & Dispatch',
      estimatedValue: 48000,
      expectedPurchaseDate: new Date(Date.now() + 60 * 86400000),
      tags: ['energy', 'whatsapp-inbound'],
      notes: 'Chatted via WhatsApp Business. Needs field technician assignment capabilities.',
      consentGiven: true,
      nextFollowUpAt: new Date(Date.now() + 2 * 86400000),
      lastContactAt: new Date(Date.now() - 2 * 86400000),
    },
    {
      firstName: 'Liam',
      lastName: 'O\'Connor',
      email: 'liam.oconnor@galwaylogistics.ie',
      phone: '+353-87-555-0144',
      whatsapp: '+353-87-555-0144',
      companyName: 'Galway Freight & Logistics',
      jobTitle: 'Managing Director',
      website: 'https://galwaylogistics.ie',
      industry: 'Logistics & Supply Chain',
      city: 'Dublin',
      country: 'Ireland',
      source: 'SOCIAL',
      sourceCampaign: 'LinkedIn B2B Campaign',
      sourceChannel: 'linkedin_sponsored',
      ownerId: rep1.id,
      teamId: enterpriseTeam.id,
      status: 'NEW',
      qualificationScore: 65,
      priority: 'MEDIUM',
      interestedProduct: 'Lead Automation Engine',
      estimatedValue: 35000,
      tags: ['europe', 'linkedin-lead', 'logistics'],
      notes: 'Submitted form via LinkedIn sponsored post on supply chain CRM modernization.',
      consentGiven: true,
      nextFollowUpAt: new Date(Date.now() + 1 * 86400000),
    },
    {
      firstName: 'Ananya',
      lastName: 'Patel',
      email: 'ananya.p@zenithfin.in',
      phone: '+91-98200-11223',
      whatsapp: '+91-98200-11223',
      companyName: 'Zenith Capital Advisors',
      jobTitle: 'Chief Operating Officer',
      website: 'https://zenithfin.in',
      industry: 'Financial Services',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      source: 'PHONE_CALL',
      sourceCampaign: 'Executive Referral',
      sourceChannel: 'inbound_telephony',
      ownerId: rep2.id,
      teamId: enterpriseTeam.id,
      status: 'QUALIFIED',
      qualificationScore: 92,
      priority: 'URGENT',
      interestedProduct: 'Full CRM & Compliance Suite',
      estimatedValue: 110000,
      expectedPurchaseDate: new Date(Date.now() + 15 * 86400000),
      tags: ['apac', 'urgent', 'referral', 'high-value'],
      notes: 'Executive inbound phone call. Ready for contract review upon feature confirmation.',
      consentGiven: true,
      nextFollowUpAt: new Date(Date.now() + 1 * 86400000),
      lastContactAt: new Date(Date.now() - 1 * 86400000),
    },
    {
      firstName: 'Marcus',
      lastName: 'Aurelius',
      email: 'm.aurelius@stoicbuilders.com',
      phone: '+1-312-555-0177',
      companyName: 'Stoic Commercial Construction',
      jobTitle: 'VP Procurement',
      industry: 'Construction',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      source: 'SMS',
      sourceCampaign: 'Trade Expo Follow-up',
      sourceChannel: 'sms_outreach',
      ownerId: rep1.id,
      status: 'NURTURING',
      qualificationScore: 45,
      priority: 'LOW',
      estimatedValue: 20000,
      tags: ['expo-2026', 'construction'],
      notes: 'Responded to SMS campaign. Currently in budget planning for next fiscal year.',
      consentGiven: true,
    },
    {
      firstName: 'Priya',
      lastName: 'Nair',
      email: 'priya.nair@healthpulse.com',
      phone: '+1-206-555-9988',
      companyName: 'HealthPulse Diagnostics',
      jobTitle: 'Head of Growth',
      industry: 'Healthcare Technology',
      city: 'Seattle',
      state: 'WA',
      country: 'USA',
      source: 'WEBSITE',
      sourceCampaign: 'Google Ads Search',
      sourceChannel: 'cpc',
      status: 'NEW',
      qualificationScore: 50,
      priority: 'MEDIUM',
      estimatedValue: 30000,
      tags: ['google-ads', 'unassigned'],
      notes: 'Submitted via website landing page. Unassigned lead awaiting automatic routing.',
      consentGiven: true,
    },
  ];

  const createdLeads = [];
  for (const lData of leadsData) {
    const lead = await prisma.lead.create({
      data: {
        ...lData,
        organizationId: org.id,
        createdById: owner.id,
      },
    });
    createdLeads.push(lead);
  }

  console.log('--- Creating Tasks & Reminders ---');
  await prisma.task.create({
    data: {
      organizationId: org.id,
      title: 'Conduct customized 150-seat demo for Apex Technologies',
      description: 'Prepare pipeline automation & reporting walk-through for Robert Chen.',
      taskType: 'MEETING',
      priority: 'URGENT',
      status: 'PENDING',
      dueDate: new Date(Date.now() + 1 * 86400000),
      dueTime: '14:00',
      assignedToId: rep1.id,
      createdById: manager.id,
      leadId: createdLeads[0].id,
      reminderAt: new Date(Date.now() + 1 * 86400000 - 3600000),
    },
  });

  await prisma.task.create({
    data: {
      organizationId: org.id,
      title: 'Send WhatsApp brochure and API documentation',
      description: 'Send PDF datasheet on field technician dispatch to Sophia Martinez.',
      taskType: 'WHATSAPP',
      priority: 'HIGH',
      status: 'PENDING',
      dueDate: new Date(Date.now() + 2 * 86400000),
      assignedToId: rep2.id,
      leadId: createdLeads[1].id,
    },
  });

  await prisma.task.create({
    data: {
      organizationId: org.id,
      title: 'Follow up on proposal review with Daniel Sterling',
      description: 'Confirm security review timeline for Vertex Cloud deal.',
      taskType: 'CALL',
      priority: 'HIGH',
      status: 'PENDING',
      dueDate: new Date(Date.now() - 1 * 86400000), // Overdue task for testing alert indicators
      assignedToId: rep1.id,
      dealId: deal1.id,
      contactId: contact1.id,
    },
  });

  await prisma.task.create({
    data: {
      organizationId: org.id,
      title: 'Finalize enterprise contract MSA for Nexus BioHealth',
      description: 'Signatures gathered and archived in deal attachments.',
      taskType: 'INTERNAL',
      priority: 'MEDIUM',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() - 5 * 86400000),
      completedAt: new Date(Date.now() - 5 * 86400000),
      assignedToId: rep2.id,
      dealId: deal2.id,
      outcome: 'Signed and countersigned successfully.',
    },
  });

  console.log('--- Creating Customer Interactions & Timelines ---');
  await prisma.interaction.create({
    data: {
      organizationId: org.id,
      leadId: createdLeads[0].id,
      actorId: rep1.id,
      type: 'CALL',
      direction: 'OUTBOUND',
      summary: 'Discovery call with Robert Chen (Apex Technologies)',
      body: 'Discussed their current legacy CRM bottlenecks. They have 150 sales reps and require automated round-robin routing and WhatsApp integration.',
      outcome: 'Scheduled live demonstration for tomorrow.',
      durationSeconds: 940,
      metadata: { telephonyProvider: 'Twilio Voice', callRecordingUrl: 'https://storage.crm.internal/recordings/call-9912.mp3' },
    },
  });

  await prisma.interaction.create({
    data: {
      organizationId: org.id,
      leadId: createdLeads[1].id,
      actorId: rep2.id,
      type: 'WHATSAPP',
      direction: 'INBOUND',
      summary: 'Inbound WhatsApp Inquiry: Field Dispatch capabilities',
      body: 'Hello, we are evaluating your CRM for our 80 clean energy dispatch agents in Texas. Does your system support instant WhatsApp notification upon lead capture?',
      outcome: 'Replied with affirmation and scheduled detailed follow-up.',
      metadata: { whatsappMessageId: 'wamid.HBgLMTk5MjAw...' },
    },
  });

  await prisma.interaction.create({
    data: {
      organizationId: org.id,
      dealId: deal1.id,
      actorId: rep1.id,
      type: 'EMAIL',
      direction: 'OUTBOUND',
      summary: 'Delivered customized Proposal & Pricing Tier',
      body: 'Sent proposal PDF covering 150 enterprise licenses with SOC2 compliance documentation.',
      outcome: 'Opened by client 12 minutes later.',
    },
  });

  console.log('--- Creating Assignment Rules ---');
  await prisma.leadAssignmentRule.create({
    data: {
      organizationId: org.id,
      name: 'Tier-1 High Value Round Robin',
      priority: 1,
      isActive: true,
      strategy: 'ROUND_ROBIN',
      conditions: { qualificationScoreMin: 70 },
      roundRobinUserIds: [rep1.id, rep2.id],
      fallbackUserId: manager.id,
    },
  });

  await prisma.leadAssignmentRule.create({
    data: {
      organizationId: org.id,
      name: 'Default Inbound Website Routing',
      priority: 2,
      isActive: true,
      strategy: 'BY_TEAM',
      conditions: { source: 'WEBSITE' },
      assignToTeamId: enterpriseTeam.id,
      fallbackUserId: rep1.id,
    },
  });

  console.log('--- Creating Automation Rules ---');
  await prisma.automationRule.create({
    data: {
      organizationId: org.id,
      name: 'Instant Follow-Up Task on High-Priority Lead',
      description: 'Creates a 24h follow-up task whenever a high priority lead is created.',
      isActive: true,
      triggerType: 'LEAD_CREATED',
      conditions: [{ field: 'priority', operator: 'equals', value: 'HIGH' }],
      actions: [
        { type: 'create_task', title: 'Urgent: Contact high-priority lead within 24h', priority: 'URGENT', dueHours: 24 },
        { type: 'send_notification', message: 'New high priority lead assigned to you!' }
      ],
      executionCount: 14,
      lastExecutedAt: new Date(),
    },
  });

  await prisma.automationRule.create({
    data: {
      organizationId: org.id,
      name: 'Automated Celebration & Task on Deal Won',
      description: 'Creates onboarding checklist task when deal status changes to WON.',
      isActive: true,
      triggerType: 'DEAL_WON',
      conditions: [],
      actions: [
        { type: 'create_task', title: 'Schedule Customer Success Kickoff Call', priority: 'HIGH', dueHours: 48 },
        { type: 'send_notification', message: 'Congratulations! Deal was closed won!' }
      ],
      executionCount: 8,
      lastExecutedAt: new Date(Date.now() - 5 * 86400000),
    },
  });

  console.log('--- Creating Lead Scoring Rules ---');
  await prisma.leadScoringRule.createMany({
    data: [
      { organizationId: org.id, name: 'VP or C-Level Job Title', criteriaType: 'JOB_TITLE', condition: 'CONTAINS', value: 'VP,Director,Chief,COO,CMO,CTO', scoreDelta: 25 },
      { organizationId: org.id, name: 'Enterprise Employee Size', criteriaType: 'COMPANY_SIZE', condition: 'GREATER_THAN', value: '100', scoreDelta: 20 },
      { organizationId: org.id, name: 'High-intent Referral Source', criteriaType: 'SOURCE', condition: 'EQUALS', value: 'REFERRAL', scoreDelta: 30 },
      { organizationId: org.id, name: 'Direct Inbound Phone Call', criteriaType: 'SOURCE', condition: 'EQUALS', value: 'PHONE_CALL', scoreDelta: 20 },
    ],
  });

  console.log('--- Creating Lead Capture Form ---');
  await prisma.leadCaptureForm.create({
    data: {
      organizationId: org.id,
      name: 'Main Website Contact & Enterprise Demo Form',
      publicFormKey: 'acme-inbound-demo-form-2026',
      isActive: true,
      submitButtonText: 'Request Enterprise Demo',
      successMessage: 'Thank you for reaching out! A dedicated sales specialist will contact you within 2 hours.',
      defaultLeadSource: 'WEBSITE',
      defaultCampaign: 'Global Inbound 2026',
      defaultOwnerId: rep1.id,
      submissionsCount: 42,
      fieldConfig: [
        { name: 'firstName', label: 'First Name', type: 'text', required: true },
        { name: 'lastName', label: 'Last Name', type: 'text', required: true },
        { name: 'email', label: 'Work Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone Number', type: 'tel', required: false },
        { name: 'companyName', label: 'Company Name', type: 'text', required: true },
        { name: 'jobTitle', label: 'Job Title', type: 'text', required: false },
        { name: 'notes', label: 'How can we help your team?', type: 'textarea', required: false },
      ],
    },
  });

  console.log('--- Creating Integration Accounts ---');
  await prisma.integrationAccount.create({
    data: {
      organizationId: org.id,
      provider: 'WHATSAPP',
      name: 'Official WhatsApp Business Cloud API',
      isActive: true,
      status: 'CONNECTED',
      credentials: {
        phoneNumberId: '10884218529381',
        wabaId: '392819028310',
        configuredAt: new Date().toISOString(),
      },
      settings: {
        autoCreateLeadOnMessage: true,
        notifyOnInbound: true,
      },
    },
  });

  await prisma.integrationAccount.create({
    data: {
      organizationId: org.id,
      provider: 'TWILIO_SMS',
      name: 'Twilio SMS & Voice Gateway',
      isActive: true,
      status: 'CONNECTED',
      credentials: {
        accountSid: 'AC_dummy_production_ready_sid_configured',
        phoneNumber: '+1-800-555-ACME',
      },
      settings: {
        enableInboundWebhook: true,
      },
    },
  });

  console.log('--- Creating Audit Logs ---');
  await prisma.auditLog.createMany({
    data: [
      { organizationId: org.id, userId: owner.id, action: 'CREATE', entityType: 'ORGANIZATION', entityId: org.id, newData: { name: org.name } },
      { organizationId: org.id, userId: manager.id, action: 'UPDATE', entityType: 'DEAL', entityId: deal1.id, newData: { stage: 'Proposal Sent', amount: 125000 } },
      { organizationId: org.id, userId: rep2.id, action: 'CONVERT', entityType: 'LEAD', entityId: 'lead-prev-conv', newData: { convertedContactId: contact2.id, convertedCompanyId: comp2.id, convertedDealId: deal2.id } },
    ],
  });

  console.log('=== SEEDING COMPLETED SUCCESSFULLY ===');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
