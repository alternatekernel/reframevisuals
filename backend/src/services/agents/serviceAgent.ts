import { prisma } from '../../database';

export const ServiceAgent = {
  name: 'ServiceAgent',
  description: 'Fetches technical specifications and SLA details for specific editing services.',
  
  async execute(params?: { serviceId?: string }): Promise<any> {
    try {
      const serviceId = params?.serviceId || 'background-removal';
      const slug = serviceId.toLowerCase();

      const policy = await prisma.platformPolicy.findUnique({
        where: { key: 'SERVICE_SPECS' }
      });

      const serviceDatabase = policy ? JSON.parse(policy.content) : {
        'ghost-mannequin': {
          name: 'Ghost Mannequin / 3D Hollow',
          turnaround: '24 Hours',
          specs: ['Neck joint removal', 'Natural shadowing', '3D shape preservation'],
          formats: ['PSD', 'PNG', 'TIFF'],
          complexity: 'High'
        },
        'background-removal': {
          name: 'Precision Background Removal',
          turnaround: '12-24 Hours',
          specs: ['Hand-drawn clipping paths', 'Soft-edge masking', 'Natural drop shadow'],
          formats: ['JPG', 'PNG'],
          complexity: 'Standard'
        }
      };

      const data = serviceDatabase[slug] || serviceDatabase['background-removal'];

      return {
        success: true,
        source: 'ServiceAgent (Database Specs)',
        data
      };
    } catch (error) {
      console.error('ServiceAgent failed:', error);
      return { success: false, source: 'ServiceAgent', error: 'Database access failure' };
    }
  }
};
