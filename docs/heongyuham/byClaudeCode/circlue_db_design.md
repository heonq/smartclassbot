# Circlue.ai 데이터베이스 설계

## 개요

Circlue.ai는 한국 브랜드와 중국 인플루언서를 연결하는 AI 기반 마케팅 플랫폼입니다.
이 문서는 시스템의 핵심 기능을 지원하기 위한 데이터베이스 스키마를 정의합니다.

## 주요 엔티티

### 1. 사용자 관리

#### users

사용자 계정 정보를 저장하는 기본 테이블

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('brand', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### user_sessions

사용자 세션 관리

```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2. 브랜드 관리

#### brands

브랜드 기본 정보 및 스토리

```sql
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    website VARCHAR(255),
    story TEXT,
    channels TEXT[], -- 판매 채널 배열
    marketing TEXT,
    social_channels TEXT[], -- SNS 채널 배열
    category VARCHAR(50),
    logo_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3. 제품 관리

#### products

제품 상세 정보

```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    purchase_url VARCHAR(255),
    unit VARCHAR(50),
    price DECIMAL(10, 2),
    ingredients TEXT,
    usage TEXT,
    effects TEXT,
    usp TEXT, -- Unique Selling Proposition
    target_gender VARCHAR(20) CHECK (target_gender IN ('male', 'female', 'unisex')),
    target_age VARCHAR(20), -- 예: "20-29"
    category VARCHAR(50),
    image_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 4. 인플루언서 관리

#### influencers

인플루언서 마스터 정보

```sql
CREATE TABLE influencers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    real_name VARCHAR(100),
    category VARCHAR(50),
    platform VARCHAR(50) CHECK (platform IN ('douyin', 'xiaohongshu', 'weibo', 'bilibili')),
    region VARCHAR(50),
    followers INTEGER,
    avg_views INTEGER,
    avg_likes INTEGER,
    avg_comments INTEGER,
    engagement_rate DECIMAL(5, 2),
    profile_image_url VARCHAR(255),
    instagram_url VARCHAR(255),
    youtube_url VARCHAR(255),
    xiaohongshu_url VARCHAR(255),
    tiktok_url VARCHAR(255),
    douyin_url VARCHAR(255),
    weibo_url VARCHAR(255),
    bilibili_url VARCHAR(255),
    base_fee DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 5. 캠페인 관리

#### campaigns

캠페인 기본 정보

```sql
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    budget DECIMAL(10, 2) NOT NULL,
    campaign_start_date DATE NOT NULL,
    campaign_end_date DATE NOT NULL,
    proposal_deadline DATE NOT NULL,
    ad_type VARCHAR(50) CHECK (ad_type IN ('branding', 'live-commerce')),
    status VARCHAR(50) NOT NULL DEFAULT 'creating',
    current_stage INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### campaign_target_content

캠페인 타겟 및 콘텐츠 전략

```sql
CREATE TABLE campaign_target_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID UNIQUE NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    influencer_categories TEXT[],
    target_age VARCHAR(20),
    usp_importance INTEGER CHECK (usp_importance BETWEEN 1 AND 5),
    influencer_impact TEXT,
    additional_description TEXT,
    secondary_content_usage BOOLEAN DEFAULT false
);
```

#### campaign_influencers

캠페인-인플루언서 연결 관리

```sql
CREATE TABLE campaign_influencers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
    proposed_fee DECIMAL(10, 2),
    ad_fee DECIMAL(10, 2),
    deliverables TEXT[],
    additional_terms TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'invited',
    production_start_date DATE,
    production_deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, influencer_id)
);
```

### 6. 페르소나 관리

#### personas

AI 생성 타겟 페르소나

```sql
CREATE TABLE personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    age VARCHAR(20),
    gender VARCHAR(20),
    interests TEXT[],
    occupation VARCHAR(100),
    lifestyle TEXT,
    shopping_habits TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 7. 콘텐츠 관리

#### content_plans

콘텐츠 기획 관리

```sql
CREATE TABLE content_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
    content_type VARCHAR(20) CHECK (content_type IN ('image', 'video')),
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    plan_data JSONB NOT NULL, -- 이미지/비디오 기획 데이터
    current_revision_number INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### content_submissions

제출된 콘텐츠 관리

```sql
CREATE TABLE content_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
    content_type VARCHAR(20) CHECK (content_type IN ('image', 'video')),
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    current_revision_number INTEGER DEFAULT 0,
    published_url VARCHAR(255),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### content_files

콘텐츠 파일 관리

```sql
CREATE TABLE content_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES content_submissions(id) ON DELETE CASCADE,
    file_url VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    thumbnail_url VARCHAR(255),
    duration INTEGER, -- 비디오의 경우 초 단위
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### content_revisions

콘텐츠 수정 이력

```sql
CREATE TABLE content_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_plan_id UUID REFERENCES content_plans(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES content_submissions(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL,
    feedback TEXT,
    feedback_by UUID REFERENCES users(id),
    status VARCHAR(50),
    revision_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        (content_plan_id IS NOT NULL AND submission_id IS NULL) OR
        (content_plan_id IS NULL AND submission_id IS NOT NULL)
    )
);
```

### 8. 성과 분석

#### performance_metrics

콘텐츠 성과 지표

```sql
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
    content_submission_id UUID REFERENCES content_submissions(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    metric_date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5, 2),
    click_through_rate DECIMAL(5, 2),
    conversion_rate DECIMAL(5, 2),
    sales_amount DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, influencer_id, platform, metric_date)
);
```

#### comment_analysis

댓글 감정 분석

```sql
CREATE TABLE comment_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    performance_metric_id UUID NOT NULL REFERENCES performance_metrics(id) ON DELETE CASCADE,
    total_comments INTEGER,
    positive_comments INTEGER,
    negative_comments INTEGER,
    neutral_comments INTEGER,
    key_topics TEXT[],
    sentiment_score DECIMAL(3, 2), -- -1.0 ~ 1.0
    analysis_data JSONB,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 9. 정산 관리

#### settlements

정산 기본 정보

```sql
CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### tax_invoices

세금계산서 관리

```sql
CREATE TABLE tax_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    business_number VARCHAR(50),
    company_name VARCHAR(100),
    ceo_name VARCHAR(50),
    address TEXT,
    business_type VARCHAR(50),
    business_item VARCHAR(50),
    amount DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    issued_date DATE NOT NULL,
    file_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### payments

결제 정보

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    paid_amount DECIMAL(10, 2) NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE NOT NULL,
    receipt_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 10. 시스템 관리

#### audit_logs

시스템 감사 로그

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### notifications

사용자 알림

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 인덱스

성능 최적화를 위한 주요 인덱스:

```sql
-- 사용자 관련
CREATE INDEX idx_users_email ON users(email);

-- 캠페인 관련
CREATE INDEX idx_campaigns_brand_id ON campaigns(brand_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaign_influencers_campaign_id ON campaign_influencers(campaign_id);
CREATE INDEX idx_campaign_influencers_influencer_id ON campaign_influencers(influencer_id);

-- 콘텐츠 관련
CREATE INDEX idx_content_submissions_campaign_id ON content_submissions(campaign_id);

-- 성과 관련
CREATE INDEX idx_performance_metrics_campaign_id ON performance_metrics(campaign_id);
CREATE INDEX idx_performance_metrics_date ON performance_metrics(metric_date);

-- 시스템 관련
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

## 트리거

자동 업데이트를 위한 트리거:

```sql
-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 각 테이블에 트리거 적용
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 이하 모든 updated_at 컬럼이 있는 테이블에 동일하게 적용
```

## 캠페인 상태 워크플로우

캠페인 상태 전환 규칙:

1. `creating` → `submitted`: 캠페인 생성 완료
2. `submitted` → `recruiting`: 인플루언서 모집 시작
3. `recruiting` → `proposing`: 제안서 작성
4. `proposing` → `revising`: 수정 요청
5. `revising` → `confirmed`: 최종 확정
6. `confirmed` → `planning`: 콘텐츠 기획
7. `planning` → `producing`: 콘텐츠 제작
8. `producing` → `content-review`: 콘텐츠 검토
9. `content-review` → `live`: 라이브 진행
10. `live` → `monitoring`: 성과 모니터링
11. `monitoring` → `completed`: 캠페인 완료

## 보안 고려사항

1. **Row Level Security (RLS)**: 브랜드 사용자는 자신의 브랜드 데이터만 접근 가능

```sql
-- 브랜드 테이블 RLS 정책 예시
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY brand_isolation ON brands
    FOR ALL TO brand_users
    USING (user_id = current_user_id());
```

2. **암호화**: 민감한 정보는 암호화하여 저장

   - 개인정보 (real_name, phone 등)
   - 계약 정보 (contract_url, fee 등)
   - 결제 정보 (transaction_id, payment_method 등)

3. **감사 로그**: 모든 중요한 데이터 변경사항은 audit_logs에 기록

4. **백업 전략**:
   - 일일 자동 백업 (최근 30일 보관)
   - 주간 백업 (최근 12주 보관)
   - 월간 백업 (영구 보관)

## 확장성 고려사항

1. **파티셔닝**:
   - `performance_metrics`: metric_date 기준 월별 파티셔닝
   - `audit_logs`: created_at 기준 월별 파티셔닝

```sql
-- 성과 메트릭 파티셔닝 예시
CREATE TABLE performance_metrics_2024_01 PARTITION OF performance_metrics
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

2. **샤딩**:

   - 인플루언서 데이터는 platform별로 샤딩 가능
   - 캠페인 데이터는 brand_id 해시 기반 샤딩 가능

3. **캐싱 전략**:

   - Redis를 활용한 자주 조회되는 데이터 캐싱
   - 인플루언서 프로필, 브랜드 정보 등은 TTL 1시간
   - 성과 메트릭은 TTL 5분

4. **읽기 전용 복제본**:
   - 분석 쿼리는 읽기 전용 복제본에서 실행
   - 실시간 대시보드는 마스터 DB 사용

## 마이그레이션 전략

1. **버전 관리**: Flyway 사용

```sql
-- V1__initial_schema.sql
-- V2__add_influencer_metrics.sql
-- V3__add_comment_analysis.sql
```

2. **롤백 계획**: 각 마이그레이션에 대한 롤백 스크립트 준비

```sql
-- U1__rollback_initial_schema.sql
-- U2__rollback_add_influencer_metrics.sql
```

3. **무중단 배포**:
   - 새 컬럼은 NULL 허용으로 추가
   - 기존 컬럼 삭제는 2단계로 진행 (deprecate → remove)
   - 인덱스는 CONCURRENTLY 옵션으로 생성

## 성능 최적화 가이드라인

1. **쿼리 최적화**:

   - JOIN 시 인덱스 활용 확인
   - N+1 문제 방지를 위한 eager loading
   - 대용량 데이터는 cursor 기반 페이지네이션

2. **Connection Pooling**:

   - 최대 연결 수: 100
   - 유휴 연결 유지: 10
   - 연결 타임아웃: 30초

3. **Vacuum 전략**:
   - 자동 vacuum 활성화
   - 주간 VACUUM ANALYZE 스케줄링
   - 월간 VACUUM FULL 실행 (유지보수 시간)

## 모니터링 지표

주요 모니터링 대상:

1. 쿼리 성능 (슬로우 쿼리 로그)
2. 테이블 크기 및 인덱스 사용률
3. Connection pool 사용률
4. Replication lag (읽기 복제본)
5. 디스크 사용량 및 I/O
