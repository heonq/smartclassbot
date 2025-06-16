import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, Users, DollarSign, FileText, Video, Edit, Plus, Send, Save, Clock, CheckCircle, Play } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import CampaignWorkflowSteps from '@/components/CampaignWorkflowSteps';
import InfluencerManagementTab from '@/components/campaign/InfluencerManagementTab';
import ContentPlanForm from '@/components/content/ContentPlanForm';
import ContentRevisionTimeline from '@/components/content/ContentRevisionTimeline';
import RevisionRequestForm from '@/components/content/RevisionRequestForm';
import ContentPlanDetailView from '@/components/content/ContentPlanDetailView';
import AdminContentReviewTab from '@/components/content/AdminContentReviewTab';
import { ContentPlanDetail } from '@/types/content';
import { contentService } from '@/services/content.service';
import { useCampaignDetail } from '@/hooks/useCampaignDetail';
import { useInlineComments } from '@/hooks/useInlineComments';
import { useFieldFeedback } from '@/hooks/useFieldFeedback';
import { useFieldEditing } from '@/hooks/useFieldEditing';
import ProductionScheduleManager from '@/components/content/ProductionScheduleManager';
import ContentProductionTab from '@/components/content/ContentProductionTab';
import ChinesePlatformUrlInput from '@/components/analytics/ChinesePlatformUrlInput';
import MonitoringUrlList from '@/components/analytics/MonitoringUrlList';
import { PlatformUrlData } from '@/types/analytics';
import { analyticsService } from '@/services/analytics.service';

const AdminCampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    campaign,
    isLoading,
    activeTab,
    setActiveTab,
    handleInfluencerApproval,
    updateCampaignInfluencers,
    toast
  } = useCampaignDetail();

  const [contentPlans, setContentPlans] = useState<ContentPlanDetail[]>([]);
  const [selectedInfluencer, setSelectedInfluencer] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<ContentPlanDetail | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRevisionFeedbackForm, setShowRevisionFeedbackForm] = useState(false);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [justEditedField, setJustEditedField] = useState<string | null>(null); // 방금 편집한 필드 추적
  const [monitoringUrls, setMonitoringUrls] = useState<PlatformUrlData[]>([]);

  const {
    activeCommentField,
    inlineComments,
    currentComment,
    handleInlineComment,
    handleSaveInlineComment,
    handleCancelInlineComment,
    getFieldComment,
    resetComments
  } = useInlineComments();

  // 편집 기능을 위한 훅 추가
  const {
    editingField,
    editingValue,
    setEditingValue,
    startEditing,
    saveEdit,
    cancelEdit
  } = useFieldEditing({
    onSaveEdit: async (planId: string, fieldName: string, newValue: any) => {
      try {
        console.log('🔧 필드 편집 저장:', { planId, fieldName, newValue });
        
        const plan = contentPlans.find(p => p.id === planId);
        if (!plan) {
          throw new Error('기획안을 찾을 수 없습니다');
        }

        // planData 업데이트
        const updatedPlanData = {
          ...plan.planData,
          [fieldName]: newValue
        };

        await contentService.updateContentPlan(plan.campaignId, planId, {
          planData: updatedPlanData,
          updatedAt: new Date().toISOString()
        });

        // 로컬 상태 업데이트
        setContentPlans(prev => prev.map(p => 
          p.id === planId 
            ? { ...p, planData: updatedPlanData, updatedAt: new Date().toISOString() }
            : p
        ));

        // 선택된 기획안도 업데이트
        if (selectedPlan?.id === planId) {
          setSelectedPlan(prev => prev ? {
            ...prev,
            planData: updatedPlanData,
            updatedAt: new Date().toISOString()
          } : null);
        }

        toast({
          title: "필드 수정 완료",
          description: `${fieldName} 필드가 성공적으로 수정되었습니다.`
        });

      } catch (error) {
        console.error('필드 편집 저장 실패:', error);
        toast({
          title: "저장 실패",
          description: "필드 수정 저장에 실패했습니다.",
          variant: "destructive"
        });
        throw error;
      }
    },
    onAfterSave: (planId: string, fieldName: string) => {
      // 편집 완료 후 피드백 모드 활성화
      setJustEditedField(`${planId}-${fieldName}`);
      setShowRevisionFeedbackForm(true);
      
      console.log('📝 편집 완료 - 피드백 모드 활성화:', { planId, fieldName });
    }
  });

  useEffect(() => {
    const loadContentPlans = async () => {
      if (!campaign?.id) return;

      try {
        setIsContentLoading(true);
        console.log('=== 시스템 관리자 - 콘텐츠 기획안 로딩 시작 ===');
        console.log('캠페인 ID:', campaign.id);
        
        // 디버깅 정보 먼저 출력
        await contentService.debugContentPlanStorage();
        
        const plans = await contentService.getContentPlans(campaign.id);
        console.log('=== 로딩된 기획안들 ===');
        plans.forEach(plan => {
          console.log(`기획안 ID: ${plan.id}`);
          console.log(`인플루언서: ${plan.influencerName}`);
          console.log(`상태: ${plan.status}`);
          console.log(`수정 요청 개수: ${plan.revisions?.length || 0}`);
          if (plan.revisions && plan.revisions.length > 0) {
            console.log('수정 요청 내역:');
            plan.revisions.forEach(revision => {
              console.log(`  - ${revision.revisionNumber}차: ${revision.feedback} (상태: ${revision.status})`);
            });
          }
        });
        
        setContentPlans(plans);
        console.log('=== 시스템 관리자 기획안 로딩 완료 ===');
        
      } catch (error) {
        console.error('콘텐츠 기획안 로딩 실패:', error);
        toast({
          title: "기획안 로딩 실패",
          description: "콘텐츠 기획안을 불러오는데 실패했습니다.",
          variant: "destructive"
        });
      } finally {
        setIsContentLoading(false);
      }
    };

    loadContentPlans();
  }, [campaign?.id, toast]);

  // 탭 변경 시 데이터 리로드
  useEffect(() => {
    if (activeTab === 'planning' && campaign?.id) {
      const reloadPlans = async () => {
        console.log('🔄 탭 변경 - 기획안 재로딩');
        try {
          const plans = await contentService.getContentPlans(campaign.id);
          setContentPlans(plans);
        } catch (error) {
          console.error('재로딩 실패:', error);
        }
      };
      reloadPlans();
    }
  }, [activeTab, campaign?.id]);

  // 모니터링 URL 로딩
  useEffect(() => {
    const loadMonitoringUrls = () => {
      if (!campaign?.id) return;
      
      try {
        console.log('=== 모니터링 URL 로딩 시작 ===');
        console.log('캠페인 ID:', campaign.id);
        
        const urls = analyticsService.getMonitoringUrls(campaign.id);
        setMonitoringUrls(urls);
        
        console.log('=== 로딩된 모니터링 URL ===');
        console.log('URL 개수:', urls.length);
        urls.forEach(url => {
          console.log(`- ${url.platform}: ${url.influencerName} - ${url.url}`);
        });
      } catch (error) {
        console.error('모니터링 URL 로딩 실패:', error);
        toast({
          title: "URL 로딩 실패",
          description: "모니터링 URL을 불러오는데 실패했습니다.",
          variant: "destructive"
        });
      }
    };

    loadMonitoringUrls();
  }, [campaign?.id, toast]);

  const getStatusColor = (status: any) => {
    switch (status) {
      case 'creating': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-orange-100 text-orange-800';
      case 'recruiting': return 'bg-blue-100 text-blue-800';
      case 'proposing': return 'bg-purple-100 text-purple-800';
      case 'revising': return 'bg-red-100 text-red-800';
      case 'revision-feedback': return 'bg-amber-100 text-amber-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'plan-review': return 'bg-indigo-100 text-indigo-800';
      case 'producing': return 'bg-violet-100 text-violet-800';
      case 'content-review': return 'bg-purple-100 text-purple-800';
      case 'live': return 'bg-green-100 text-green-800';
      case 'monitoring': return 'bg-teal-100 text-teal-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      // 콘텐츠 기획 상태 (통일된 상태값)
      case 'waiting': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-blue-100 text-blue-800';
      case 'revision-request': return 'bg-orange-100 text-orange-800';
      case 'revision-feedback': return 'bg-purple-100 text-purple-800';
      case 'approved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: any) => {
    switch (status) {
      case 'creating': return '생성중';
      case 'submitted': return '제출됨';
      case 'recruiting': return '섭외중';
      case 'proposing': return '제안중';
      case 'revising': return '제안수정요청';
      case 'revision-feedback': return '제안수정피드백';
      case 'confirmed': return '확정됨';
      case 'planning': return '콘텐츠 기획중';
      case 'plan-review': return '콘텐츠 기획중';
      case 'plan-revision': return '콘텐츠 기획중';
      case 'plan-approved': return '콘텐츠 기획중';
      case 'producing': return '제작중';
      case 'content-review': return '콘텐츠검수';
      case 'live': return '라이브';
      case 'monitoring': return '모니터링';
      case 'completed': return '완료됨';
      // 콘텐츠 기획 상태 (통일된 상태값)
      case 'waiting': return '기획 대기중';
      case 'draft': return '기획초안';
      case 'revision-request': return '기획수정중';
      case 'revision-feedback': return '기획수정중';
      case 'approved': return '기획완료';
      default: return status;
    }
  };

  const handleCreateContentPlan = async (planData: Partial<ContentPlanDetail>) => {
    if (!campaign || !id || !selectedInfluencer) return;

    const { contentType } = planData;
    if (!contentType) return;

    try {
      console.log('=== 시스템 관리자 기획안 생성/수정 시작 ===');
      console.log('선택된 인플루언서:', selectedInfluencer.name);
      console.log('콘텐츠 타입:', contentType);

      await contentService.createContentPlan(id, {
        campaignId: id,
        influencerId: selectedInfluencer.id,
        influencerName: selectedInfluencer.name,
        contentType,
        status: 'draft',
        planData: planData.planData!,
        revisions: planData.revisions || [],
        currentRevisionNumber: planData.currentRevisionNumber || 0
      });

      // 기획안 목록 재로딩
      const updatedPlans = await contentService.getContentPlans(id);
      setContentPlans(updatedPlans);
      
      // UI 상태 초기화
      setSelectedPlan(null);
      setShowCreateForm(false);
      setSelectedInfluencer(null);

      console.log('=== 시스템 관리자 기획안 생성/수정 완료 ===');

      toast({
        title: "기획안 저장 완료",
        description: `${selectedInfluencer.name}의 콘텐츠 기획안이 저장되었습니다.`
      });
    } catch (error) {
      console.error('기획안 저장 실패:', error);
      toast({
        title: "저장 실패",
        description: "기획안 저장에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleRevisionFeedback = async (feedback: string) => {
    if (!selectedPlan) return;

    try {
      const planComments = inlineComments.filter(comment => comment.planId === selectedPlan.id);
      let finalFeedback = feedback.trim();

      if (planComments.length > 0) {
        const commentsFeedback = planComments.map(comment => 
          `[${comment.fieldName}] ${comment.comment}`
        ).join('\n');
        
        finalFeedback = finalFeedback 
          ? `${finalFeedback}\n\n${commentsFeedback}`
          : commentsFeedback;
      }

      // 현재 pending 상태인 revision을 찾아서 완료 처리
      const updatedRevisions = selectedPlan.revisions?.map(revision => {
        if (revision.status === 'pending') {
          return {
            ...revision,
            status: 'completed' as const,
            response: finalFeedback,
            respondedAt: new Date().toISOString(),
            respondedBy: '시스템 관리자'
          };
        }
        return revision;
      }) || [];

      const updatedPlan: ContentPlanDetail = {
        ...selectedPlan,
        status: 'revision-feedback',
        revisions: updatedRevisions,
        updatedAt: new Date().toISOString()
      };

      await contentService.updateContentPlan(selectedPlan.campaignId, selectedPlan.id, {
        status: 'revision-feedback',
        revisions: updatedRevisions,
        updatedAt: new Date().toISOString()
      });

      setContentPlans(prev => prev.map(plan => 
        plan.id === selectedPlan.id ? updatedPlan : plan
      ));

      setSelectedPlan(updatedPlan);
      setShowRevisionFeedbackForm(false);
      setJustEditedField(null); // 피드백 전송 후 초기화
      resetComments();

      toast({
        title: "수정피드백 전송 완료",
        description: "브랜드 관리자에게 수정피드백이 전송되었습니다."
      });
    } catch (error) {
      console.error('수정피드백 전송 실패:', error);
      toast({
        title: "전송 실패",
        description: "수정피드백 전송에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleEditPlan = (influencerId: string) => {
    const plan = contentPlans.find(p => p.influencerId === influencerId);
    if (plan) {
      console.log('=== 기획안 편집 시작 ===');
      console.log('선택된 기획안:', plan.id);
      console.log('인플루언서:', plan.influencerName);
      console.log('현재 상태:', plan.status);
      
      setSelectedPlan(plan);
      setShowCreateForm(false);
      setShowRevisionFeedbackForm(false);
      setJustEditedField(null); // 새 기획안 선택 시 초기화
    }
  };

  const handleCreatePlan = (influencer: any) => {
    setSelectedInfluencer(influencer);
    setSelectedPlan(null);
    setShowCreateForm(true);
    setShowRevisionFeedbackForm(false);
    setJustEditedField(null); // 새 기획안 생성 시 초기화
  };

  const canReviewPlan = (plan: ContentPlanDetail) => {
    return plan.status === 'revision-request' || plan.status === 'revision-feedback';
  };

  const hasPlanContent = (plan: ContentPlanDetail) => {
    return true; // 시스템 관리자는 항상 피드백 가능
  };

  // 기획 완료 여부 확인
  const confirmedInfluencers = campaign?.influencers.filter(inf => inf.status === 'confirmed') || [];

  const isAllPlansApproved = () => {
    if (confirmedInfluencers.length === 0) return false;
    const approvedPlans = contentPlans.filter(plan => plan.status === 'approved');
    return approvedPlans.length === confirmedInfluencers.length;
  };

  // 제작 일정 설정 완료 여부 확인
  const isAllSchedulesSet = () => {
    return confirmedInfluencers.every(inf => 
      inf.productionStartDate && inf.productionDeadline
    );
  };

  // 제작 단계 전환 가능 여부 확인 (캠페인 단계 고려)
  const canStartProduction = () => {
    return isAllPlansApproved() && isAllSchedulesSet() && campaign.currentStage < 3;
  };

  // 제작 단계 전환 불가 이유 확인
  const getProductionDisableReason = () => {
    if (campaign.currentStage >= 3) {
      return '이미 제작 단계 진행 중';
    }
    if (!isAllPlansApproved()) {
      return '모든 기획안이 승인되지 않음';
    }
    if (!isAllSchedulesSet()) {
      return '모든 제작 일정이 설정되지 않음';
    }
    return '';
  };

  // 제작 일정 업데이트
  const handleUpdateProductionSchedule = async (influencerId: string, startDate: string, deadline: string) => {
    if (!campaign) return;

    try {
      const updatedInfluencers = campaign.influencers.map(inf =>
        inf.id === influencerId 
          ? { ...inf, productionStartDate: startDate, productionDeadline: deadline }
          : inf
      );

      await updateCampaignInfluencers(updatedInfluencers);

      toast({
        title: "제작 일정 설정 완료",
        description: "인플루언서의 제작 일정이 설정되었습니다."
      });
    } catch (error) {
      console.error('제작 일정 설정 실패:', error);
      toast({
        title: "설정 실패",
        description: "제작 일정 설정에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  // 콘텐츠 제작 단계로 전환
  const handleStartProduction = async () => {
    if (!campaign) return;

    try {
      const { campaignService } = await import('@/services/campaign.service');
      await campaignService.updateCampaign(campaign.id, { 
        status: 'producing',
        currentStage: 3
      });

      toast({
        title: "콘텐츠 제작 단계 시작",
        description: "캠페인이 콘텐츠 제작 단계로 전환되었습니다."
      });

      // 페이지 새로고침하여 최신 상태 반영
      window.location.reload();
    } catch (error) {
      console.error('제작 단계 전환 실패:', error);
      toast({
        title: "전환 실패",
        description: "콘텐츠 제작 단계 전환에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  // URL 추가 핸들러
  const handleAddMonitoringUrl = async (urlData: Omit<PlatformUrlData, 'id' | 'addedAt'>) => {
    if (!campaign?.id) return;

    try {
      const newUrl = analyticsService.addMonitoringUrl(campaign.id, urlData);
      setMonitoringUrls(prev => [...prev, newUrl]);
      
      toast({
        title: "URL 등록 완료",
        description: `${urlData.influencerName}의 ${urlData.platform === 'xiaohongshu' ? '샤오홍슈' : '도우인'} 콘텐츠 URL이 등록되었습니다.`
      });
    } catch (error) {
      console.error('URL 등록 실패:', error);
      toast({
        title: "등록 실패",
        description: "URL 등록에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  // URL 삭제 핸들러
  const handleRemoveMonitoringUrl = async (urlId: string) => {
    if (!campaign?.id) return;

    try {
      analyticsService.removeMonitoringUrl(campaign.id, urlId);
      setMonitoringUrls(prev => prev.filter(url => url.id !== urlId));
      
      toast({
        title: "URL 삭제 완료",
        description: "모니터링 URL이 삭제되었습니다."
      });
    } catch (error) {
      console.error('URL 삭제 실패:', error);
      toast({
        title: "삭제 실패",
        description: "URL 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const { renderFieldWithFeedback } = useFieldFeedback({
    activeCommentField,
    currentComment,
    handleInlineComment,
    handleSaveInlineComment,
    handleCancelInlineComment,
    getFieldComment,
    canReviewPlan: () => true, // 시스템 관리자는 항상 코멘트 가능
    // 편집 기능을 위한 props 추가
    editingField,
    editingValue,
    setEditingValue,
    onStartEdit: startEditing,
    onSaveEdit: saveEdit,
    onCancelEdit: cancelEdit
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <div className="text-center">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <div className="text-center">캠페인을 찾을 수 없습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <Link to="/admin/campaigns">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                캠페인 관리로
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{campaign.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusColor(campaign.status)}>
                  {getStatusText(campaign.status)}
                </Badge>
                <Badge variant="outline" className="text-purple-600">
                  시스템 관리자 뷰
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <CampaignWorkflowSteps campaign={campaign!} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic">📋 기본정보</TabsTrigger>
            <TabsTrigger value="influencers">👥 인플루언서 관리</TabsTrigger>
            <TabsTrigger value="planning" disabled={campaign.currentStage < 2}>💡 콘텐츠 기획</TabsTrigger>
            <TabsTrigger value="production" disabled={campaign.currentStage < 3}>🎬 콘텐츠 제작</TabsTrigger>
            <TabsTrigger value="content" disabled={campaign.currentStage < 4}>🔍 콘텐츠 검수</TabsTrigger>
            <TabsTrigger value="monitoring" disabled={campaign.currentStage < 5}>📊 성과 모니터링</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>기본 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">브랜드</label>
                    <p className="text-lg">{campaign.brandName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">제품</label>
                    <p className="text-lg">{campaign.productName}</p>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">예산</label>
                      <p className="text-lg">{campaign.budget.toLocaleString()}원</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">캠페인 기간</label>
                      <p className="text-lg">{campaign.campaignStartDate} ~ {campaign.campaignEndDate}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">제안 마감일</label>
                    <p className="text-lg">{campaign.proposalDeadline}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">광고 유형</label>
                    <p className="text-lg">{campaign.adType === 'branding' ? '브랜딩' : '라이브커머스'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>타겟 콘텐츠 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">인플루언서 카테고리</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {campaign.targetContent.influencerCategories.map((category) => (
                        <Badge key={category} variant="outline">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">타겟 연령층</label>
                    <p className="text-lg">{campaign.targetContent.targetAge}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">USP 중요도</label>
                    <p className="text-lg">{campaign.targetContent.uspImportance}/10</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">인플루언서 영향력</label>
                    <p className="text-lg">{campaign.targetContent.influencerImpact}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">추가 설명</label>
                    <p className="text-lg">{campaign.targetContent.additionalDescription || '없음'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">2차 콘텐츠 활용</label>
                    <p className="text-lg">{campaign.targetContent.secondaryContentUsage ? '예' : '아니오'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="influencers" className="mt-6">
            <InfluencerManagementTab
              campaign={campaign}
              onInfluencerApproval={handleInfluencerApproval}
              onUpdateInfluencers={updateCampaignInfluencers}
              toast={toast}
            />
          </TabsContent>

          <TabsContent value="planning" className="mt-6">
            {isContentLoading ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-lg">콘텐츠 기획안을 로딩 중...</div>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-4"></div>
                </CardContent>
              </Card>
            ) : isAllPlansApproved() ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[700px]">
                {/* 좌측: 기획안 완료 현황 */}
                <div className="lg:col-span-1">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        기획안 완료 현황
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {confirmedInfluencers.map((influencer) => {
                          const plan = contentPlans.find(p => p.influencerId === influencer.id);
                          return (
                            <div key={influencer.id} className="p-3 border rounded-lg bg-green-50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">{influencer.name}</h4>
                                  <p className="text-sm text-gray-500">{influencer.platform}</p>
                                </div>
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  기획완료
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 우측: 제작 일정 관리 */}
                <div className="lg:col-span-1">
                  <ProductionScheduleManager
                    confirmedInfluencers={confirmedInfluencers}
                    onUpdateSchedule={handleUpdateProductionSchedule}
                    onStartProduction={handleStartProduction}
                    canStartProduction={canStartProduction()}
                    disableReason={getProductionDisableReason()}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
                {/* 좌측: 인플루언서 목록 */}
                <div className="lg:col-span-1">
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
                          const existingPlan = contentPlans.find(plan => plan.influencerId === influencer.id);
                          const hasPendingRevision = existingPlan?.revisions?.some(rev => rev.status === 'pending');
                          const isRevisionRequest = existingPlan?.status === 'revision-request';
                          const isRevisionFeedback = existingPlan?.status === 'revision-feedback';
                          
                          return (
                            <div key={influencer.id} className="p-3 border rounded-lg hover:bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">{influencer.name}</h4>
                                  <p className="text-sm text-gray-500">{influencer.platform}</p>
                                  {existingPlan && (
                                    <div className="mt-1 space-y-1">
                                      <Badge className={getStatusColor(existingPlan.status)}>
                                        {getStatusText(existingPlan.status)}
                                      </Badge>
                                      {(isRevisionRequest || isRevisionFeedback) && existingPlan.revisions && existingPlan.revisions.length > 0 && (
                                        <Badge className="bg-red-100 text-red-800 ml-1">
                                          {existingPlan.currentRevisionNumber}차 수정요청
                                        </Badge>
                                      )}
                                      {hasPendingRevision && (
                                        <Badge className="bg-orange-100 text-orange-800 ml-1">
                                          🔄 수정 대기
                                        </Badge>
                                      )}
                                      {existingPlan.revisions && existingPlan.revisions.length > 0 && (
                                        <p className="text-xs text-gray-500">
                                          총 수정 요청 {existingPlan.revisions.length}회
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {existingPlan ? (
                                  <Button
                                    size="sm"
                                    variant={hasPendingRevision || isRevisionRequest ? "default" : "outline"}
                                    onClick={() => handleEditPlan(influencer.id)}
                                    className={hasPendingRevision || isRevisionRequest ? "bg-orange-600 hover:bg-orange-700" : "bg-blue-50 hover:bg-blue-100"}
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    {hasPendingRevision || isRevisionRequest ? '수정 요청 확인' : '편집'}
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleCreatePlan(influencer)}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    기획안 생성
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 우측: 콘텐츠 기획 상세 */}
                <div className="lg:col-span-2">
                  {showCreateForm && selectedInfluencer ? (
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <FileText className="w-5 h-5 mr-2" />
                          콘텐츠 기획안 생성
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="h-full overflow-auto">
                        <ContentPlanForm
                          influencer={selectedInfluencer}
                          campaignId={id!}
                          onSave={handleCreateContentPlan}
                          onCancel={() => {
                            setShowCreateForm(false);
                            setSelectedInfluencer(null);
                          }}
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    <ContentPlanDetailView
                      selectedPlan={selectedPlan}
                      showRevisionForm={showRevisionFeedbackForm}
                      inlineComments={inlineComments}
                      onApprove={() => {}} // 시스템 관리자는 승인하지 않음
                      onRequestRevision={() => setShowRevisionFeedbackForm(true)}
                      onSubmitRevision={handleRevisionFeedback}
                      onCancelRevision={() => {
                        setShowRevisionFeedbackForm(false);
                        setJustEditedField(null);
                        resetComments();
                      }}
                      canReviewPlan={canReviewPlan}
                      hasPlanContent={hasPlanContent}
                      renderFieldWithFeedback={renderFieldWithFeedback}
                      plans={contentPlans}
                      // 편집 기능을 위한 props 추가
                      editingField={editingField}
                      editingValue={editingValue}
                      setEditingValue={setEditingValue}
                      onStartEdit={startEditing}
                      onSaveEdit={saveEdit}
                      onCancelEdit={cancelEdit}
                      // 편집 완료 후 피드백 모드 관련 props 추가
                      justEditedField={justEditedField}
                    />
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="production" className="mt-6">
            <ContentProductionTab
              campaignId={id!}
              confirmedInfluencers={confirmedInfluencers}
              onContentReviewReady={async () => {
                try {
                  const { campaignService } = await import('@/services/campaign.service');
                  await campaignService.updateCampaign(campaign.id, { 
                    status: 'content-review',
                    currentStage: 4
                  });

                  toast({
                    title: "콘텐츠 검수 단계로 전환",
                    description: "캠페인이 콘텐츠 검수 단계로 전환되었습니다."
                  });

                  // 페이지 새로고침하여 최신 상태 반영
                  window.location.reload();
                } catch (error) {
                  console.error('검수 단계 전환 실패:', error);
                  toast({
                    title: "전환 실패",
                    description: "콘텐츠 검수 단계 전환에 실패했습니다."
                  });
                }
              }}
            />
          </TabsContent>

          <TabsContent value="content" className="mt-6">
            <AdminContentReviewTab
              campaignId={id!}
              confirmedInfluencers={confirmedInfluencers}
              toast={toast}
            />
          </TabsContent>

          <TabsContent value="monitoring" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 좌측: URL 입력 */}
              <div>
                <ChinesePlatformUrlInput
                  confirmedInfluencers={confirmedInfluencers.map(inf => ({
                    id: inf.id,
                    name: inf.name,
                    platform: inf.platform || '기타'
                  }))}
                  onAddUrl={handleAddMonitoringUrl}
                />
              </div>

              {/* 우측: URL 목록 */}
              <div>
                <MonitoringUrlList
                  urls={monitoringUrls}
                  onRemoveUrl={handleRemoveMonitoringUrl}
                />
              </div>
            </div>
            
            {/* 하단: 성과 모니터링 안내 */}
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <div className="mb-4">
                    <Video className="w-12 h-12 mx-auto text-blue-600 mb-2" />
                    <h3 className="text-lg font-semibold text-gray-900">성과 모니터링 시스템</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    등록된 콘텐츠 URL의 성과 데이터는 시스템 관리자의 <strong>성과분석관리</strong> 메뉴에서 
                    상세히 분석할 수 있습니다.
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 <strong>다음 단계:</strong> 사이드메뉴의 "성과분석관리"에서 등록된 URL들의 성과 지표를 확인하세요.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminCampaignDetail;
