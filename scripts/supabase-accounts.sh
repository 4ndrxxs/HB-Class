#!/bin/bash
# Supabase 계정 전환 스크립트
# 사용법: source scripts/supabase-accounts.sh hb   (또는 jsado)

case "${1}" in
  hb|HB)
    export SUPABASE_ACCESS_TOKEN="sbp_acf2d9a5c559781634cf3d608502206c9515d348"
    echo "✅ Supabase: HB 계정 활성화 (HBclass 프로젝트)"
    ;;
  jsado|JSADO)
    export SUPABASE_ACCESS_TOKEN=""
    echo "✅ Supabase: jsado 계정 활성화"
    echo "⚠️  jsado 토큰을 여기에 설정하세요"
    ;;
  *)
    echo "사용법: source scripts/supabase-accounts.sh [hb|jsado]"
    echo "현재: ${SUPABASE_ACCESS_TOKEN:+설정됨} ${SUPABASE_ACCESS_TOKEN:-미설정}"
    ;;
esac
