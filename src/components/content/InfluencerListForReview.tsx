
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, MessageSquare, Users, Clock } from 'lucide-react';
import { ContentPlanDetail } from '@/types/content';

interface InfluencerListForReviewProps {
  confirmedInfluencers: any[];
  plans: ContentPlanDetail[];
  selectedPlan: ContentPlanDetail | null;
  onSelectPlan: (plan: ContentPlanDetail) => void;
  onApprove: (planId: string) => void;
  onRequestRevision: (plan: ContentPlanDetail) => void;
  getStatusColor: (status: ContentPlanDetail['status']) => string;
  getStatusText: (plan: ContentPlanDetail) => string;
  getCurrentRevisionInfo: (plan: ContentPlanDetail) => string | null;
  canReviewPlan: (plan: ContentPlanDetail) => boolean;
}

const InfluencerListForReview: React.FC<InfluencerListForReviewProps> = ({
  confirmedInfluencers,
  plans,
  selectedPlan,
  onSelectPlan,
  onApprove,
  onRequestRevision,
  getStatusColor,
  getStatusText,
  getCurrentRevisionInfo,
  canReviewPlan
}) => {
  // 수정된 revision 상태 확인 로직 - approved 상태 우선 처리
  const getDetailedRevisionStatus = (plan: ContentPlanDetail) => {
    console.log(`🔍 ${plan.influencerName}의 기획안 상세 분석:`, {
      status: plan.status,
      revisions: plan.revisions,
      currentRevisionNumber: plan.currentRevisionNumber
    });

    // 승인된 상태라면 무조건 "기획완료" 표시
    if (plan.status === 'approved') {
      console.log(`✅ ${plan.influencerName}: 승인된 상태 - 기획완료 표시`);
      return {
        text: '기획완료',
        color: 'bg-green-100 text-green-800'
      };
    }

    // revision 배열이 있는 경우 처리 (approved가 아닐 때만)
    if (plan.revisions && plan.revisions.length > 0) {
      console.log(`📋 ${plan.influencerName}: revision 목록:`, plan.revisions);

      // 1. 브랜드가 요청한 pending 수정사항 확인
      const pendingBrandRevisions = plan.revisions.filter(r => 
        r.requestedBy === 'brand' && r.status === 'pending'
      );
      
      if (pendingBrandRevisions.length > 0) {
        const revision = pendingBrandRevisions[0];
        console.log(`🔄 ${plan.influencerName}: 브랜드 요청 pending 수정사항 발견:`, revision);
        return {
          text: `${revision.revisionNumber}차 수정요청`,
          color: 'bg-orange-100 text-orange-800'
        };
      }

      // 2. 관리자가 피드백한 pending 상태 확인
      const pendingAdminRevisions = plan.revisions.filter(r => 
        r.requestedBy === 'admin' && r.status === 'pending'
      );

      if (pendingAdminRevisions.length > 0) {
        const revision = pendingAdminRevisions[0];
        console.log(`💬 ${plan.influencerName}: 관리자 피드백 pending 발견:`, revision);
        return {
          text: `${revision.revisionNumber}차 피드백 완료`,
          color: 'bg-purple-100 text-purple-800'
        };
      }

      // 3. 완료된 브랜드 수정요청이 있는 경우 - 메인 상태와 상관없이 "피드백 완료" 표시
      const completedBrandRevisions = plan.revisions.filter(r => 
        r.requestedBy === 'brand' && r.status === 'completed'
      );

      if (completedBrandRevisions.length > 0) {
        const latestCompletedRevision = completedBrandRevisions[completedBrandRevisions.length - 1];
        console.log(`✅ ${plan.influencerName}: 완료된 브랜드 수정요청 발견 (메인 상태: ${plan.status}):`, latestCompletedRevision);
        // 메인 상태가 draft여도 완료된 revision이 있으면 "피드백 완료"로 표시
        return {
          text: `${latestCompletedRevision.revisionNumber}차 피드백 완료`,
          color: 'bg-purple-100 text-purple-800'
        };
      }

      // 4. 기타 완료된 수정사항 표시
      const completedRevisions = plan.revisions.filter(r => r.status === 'completed');
      if (completedRevisions.length > 0) {
        const latestRevision = completedRevisions[completedRevisions.length - 1];
        console.log(`🎯 ${plan.influencerName}: 최근 완료된 수정사항:`, latestRevision);
        return {
          text: `${latestRevision.revisionNumber}차 완료`,
          color: 'bg-gray-100 text-gray-600'
        };
      }
    }

    // revision 배열이 없거나 비어있는 경우에만 plan.status 기반으로 판단
    console.log(`📝 ${plan.influencerName}: revision 배열이 없거나 비어있음, plan.status 기반 처리`);
    
    if (plan.status === 'revision-feedback') {
      const revisionNumber = plan.currentRevisionNumber || 1;
      console.log(`✅ ${plan.influencerName}: revision-feedback 상태, ${revisionNumber}차 피드백 완료`);
      return {
        text: `${revisionNumber}차 피드백 완료`,
        color: 'bg-purple-100 text-purple-800'
      };
    }

    if (plan.status === 'revision-request') {
      const revisionNumber = plan.currentRevisionNumber || 1;
      console.log(`📝 ${plan.influencerName}: revision-request 상태, ${revisionNumber}차 수정요청`);
      return {
        text: `${revisionNumber}차 수정요청`,
        color: 'bg-orange-100 text-orange-800'
      };
    }

    console.log(`❌ ${plan.influencerName}: 해당하는 revision 상태 없음`);
    return null;
  };

  if (confirmedInfluencers.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="text-center py-12">
          <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">확정된 인플루언서가 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="w-5 h-5 mr-2" />
          확정된 인플루언서
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {confirmedInfluencers.map((influencer) => {
            const existingPlan = plans.find(plan => plan.influencerId === influencer.id);
            const revisionStatus = existingPlan ? getDetailedRevisionStatus(existingPlan) : null;
            
            console.log(`인플루언서 ${influencer.name}의 기획안:`, existingPlan);
            console.log(`Revision 상태:`, revisionStatus);
            
            return (
              <div 
                key={influencer.id} 
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedPlan?.influencerId === influencer.id 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => existingPlan && onSelectPlan(existingPlan)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{influencer.name}</h4>
                    <p className="text-sm text-gray-500">{influencer.platform}</p>
                  </div>
                  {existingPlan && (
                    <div className="flex flex-col gap-1">
                      <Badge className={getStatusColor(existingPlan.status)}>
                        {getStatusText(existingPlan)}
                      </Badge>
                      {revisionStatus && (
                        <Badge className={revisionStatus.color}>
                          {revisionStatus.text}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                {existingPlan ? (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">
                      클릭하여 기획안 상세를 확인하고 승인/수정요청을 진행하세요.
                    </p>
                  </div>
                ) : (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-gray-500">
                      기획 대기중
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">시스템 관리자가 기획안을 작성 중입니다.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default InfluencerListForReview;
