import { Request, Response } from 'express';
import { prisma } from '../database';

const parseJsonField = (value: unknown) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
};

export const getPages = async (_req: Request, res: Response) => {
  try {
    const pages = await prisma.platformPage.findMany();
    const formattedPages = pages.map(page => ({
      ...page,
      howToAccess: parseJsonField(page.howToAccess),
      keyActions: parseJsonField(page.keyActions),
      relatedPages: parseJsonField(page.relatedPages),
    }));
    return res.json(formattedPages);
  } catch (error) {
    console.error('Error fetching platform pages:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getFlows = async (_req: Request, res: Response) => {
  try {
    const flows = await prisma.userFlow.findMany();
    const formattedFlows = flows.map(flow => ({
      ...flow,
      steps: parseJsonField(flow.steps),
      entryPoints: parseJsonField(flow.entryPoints),
    }));
    return res.json(formattedFlows);
  } catch (error) {
    console.error('Error fetching user flows:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPolicies = async (_req: Request, res: Response) => {
  try {
    const policies = await prisma.platformPolicy.findMany();
    const formattedPolicies = policies.reduce((acc: any, policy) => {
      acc[policy.key] = parseJsonField(policy.content);
      return acc;
    }, {});
    return res.json(formattedPolicies);
  } catch (error) {
    console.error('Error fetching platform policies:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPlatformKnowledge = async (_req: Request, res: Response) => {
  try {
    const [pages, flows, policies] = await Promise.all([
      prisma.platformPage.findMany(),
      prisma.userFlow.findMany(),
      prisma.platformPolicy.findMany(),
    ]);

    const formattedPages = pages.map(page => ({
      ...page,
      howToAccess: parseJsonField(page.howToAccess),
      keyActions: parseJsonField(page.keyActions),
      relatedPages: parseJsonField(page.relatedPages),
    }));

    const formattedFlows = flows.map(flow => ({
      ...flow,
      steps: parseJsonField(flow.steps),
      entryPoints: parseJsonField(flow.entryPoints),
    }));

    const formattedPolicies = policies.reduce((acc: any, policy) => {
      acc[policy.key] = parseJsonField(policy.content);
      return acc;
    }, {});

    return res.json({
      pages: formattedPages,
      flows: formattedFlows,
      policies: formattedPolicies,
    });
  } catch (error) {
    console.error('Error fetching platform knowledge:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
