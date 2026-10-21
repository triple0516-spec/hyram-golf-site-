// Release flags: enable only after provider credentials, callback, profile mapping,
// user consent and end-to-end authentication have been verified in the dashboard.
// Never store provider client secrets in this public file.
export const socialProviders = Object.freeze({
  kakao: Object.freeze({id:'kakao',label:'카카오',enabled:false}),
  facebook: Object.freeze({id:'facebook',label:'페이스북',enabled:false}),
  naver: Object.freeze({id:'custom:naver',label:'네이버',enabled:false})
});
