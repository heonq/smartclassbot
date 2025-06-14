
import { ContentPlanDetail, ContentRevision } from '@/types/content';
import { storageService } from './storage.service';

export const contentService = {
  // 콘텐츠 기획안 목록 조회
  getContentPlans: async (campaignId: string): Promise<ContentPlanDetail[]> =>
    new Promise((resolve) => {
      setTimeout(() => {
        console.log('=== contentService.getContentPlans 시작 ===');
        console.log('캠페인 ID:', campaignId);
        
        const contentPlans = storageService.getContentPlans();
        const filtered = contentPlans.filter(plan => plan.campaignId === campaignId);
        
        console.log('전체 기획안:', contentPlans.length);
        console.log('해당 캠페인 기획안:', filtered.length);
        console.log('=== contentService.getContentPlans 완료 ===');
        
        resolve(filtered);
      }, 300);
    }),

  // 개별 콘텐츠 기획안 조회
  getContentPlan: async (campaignId: string, planId: string): Promise<ContentPlanDetail | null> =>
    new Promise((resolve) => {
      setTimeout(() => {
        console.log('=== contentService.getContentPlan 시작 ===');
        console.log('캠페인 ID:', campaignId, '기획안 ID:', planId);
        
        const contentPlans = storageService.getContentPlans();
        const plan = contentPlans.find(p => p.id === planId && p.campaignId === campaignId);
        
        console.log('찾은 기획안:', plan ? plan.influencerName : 'null');
        console.log('=== contentService.getContentPlan 완료 ===');
        
        resolve(plan || null);
      }, 300);
    }),

  // 콘텐츠 기획안 생성
  createContentPlan: async (campaignId: string, planData: Omit<ContentPlanDetail, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentPlanDetail> =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log('=== contentService.createContentPlan 시작 ===');
        console.log('캠페인 ID:', campaignId);
        console.log('기획안 데이터:', planData);
        
        try {
          const contentPlans = storageService.getContentPlans();
          
          const newPlan: ContentPlanDetail = {
            ...planData,
            id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            campaignId,
            revisions: planData.revisions || [],
            currentRevisionNumber: planData.currentRevisionNumber || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          console.log('생성될 새 기획안:', newPlan);
          
          contentPlans.push(newPlan);
          const success = storageService.setContentPlans(contentPlans);
          
          if (success) {
            console.log('💾 기획안 저장 완료 - 전체 기획안:', contentPlans.length);
            console.log('=== contentService.createContentPlan 완료 ===');
            resolve(newPlan);
          } else {
            throw new Error('기획안 저장 실패');
          }
        } catch (error) {
          console.error('=== contentService.createContentPlan 실패 ===', error);
          reject(error);
        }
      }, 500);
    }),

  // 콘텐츠 기획안 업데이트
  updateContentPlan: async (campaignId: string, planId: string, updates: Partial<ContentPlanDetail>): Promise<ContentPlanDetail> =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log('=== contentService.updateContentPlan 시작 ===');
        console.log('캠페인 ID:', campaignId, '기획안 ID:', planId);
        console.log('업데이트 데이터:', updates);
        
        try {
          const contentPlans = storageService.getContentPlans();
          const index = contentPlans.findIndex(p => p.id === planId && p.campaignId === campaignId);
          
          if (index !== -1) {
            const originalPlan = contentPlans[index];
            console.log('원본 기획안:', originalPlan.influencerName);
            
            contentPlans[index] = {
              ...contentPlans[index],
              ...updates,
              updatedAt: new Date().toISOString()
            };
            
            console.log('업데이트된 기획안:', contentPlans[index].influencerName);
            
            const success = storageService.setContentPlans(contentPlans);
            
            if (success) {
              console.log('=== contentService.updateContentPlan 완료 ===');
              resolve(contentPlans[index]);
            } else {
              throw new Error('기획안 업데이트 저장 실패');
            }
          } else {
            throw new Error('기획안을 찾을 수 없음');
          }
        } catch (error) {
          console.error('=== contentService.updateContentPlan 실패 ===', error);
          reject(error);
        }
      }, 300);
    }),

  // 콘텐츠 기획안 삭제
  deleteContentPlan: async (campaignId: string, planId: string): Promise<void> =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log('=== contentService.deleteContentPlan 시작 ===');
        console.log('캠페인 ID:', campaignId, '기획안 ID:', planId);
        
        try {
          const contentPlans = storageService.getContentPlans();
          const index = contentPlans.findIndex(p => p.id === planId && p.campaignId === campaignId);
          
          if (index !== -1) {
            const deletedPlan = contentPlans[index];
            contentPlans.splice(index, 1);
            
            const success = storageService.setContentPlans(contentPlans);
            
            if (success) {
              console.log('삭제된 기획안:', deletedPlan.influencerName);
              console.log('=== contentService.deleteContentPlan 완료 ===');
              resolve();
            } else {
              throw new Error('기획안 삭제 저장 실패');
            }
          } else {
            throw new Error('삭제할 기획안을 찾을 수 없음');
          }
        } catch (error) {
          console.error('=== contentService.deleteContentPlan 실패 ===', error);
          reject(error);
        }
      }, 300);
    })
};
