export type Board={id:string;name:string;url:string;category:string;description:string;color:string;favorite:number;status:string;due:string;note:string;visited:number;revision:number;created:number};
export const defaults:Board[]=[
{id:'sales',name:'매출 예측 · 마감 관리',url:'https://yhbae106.github.io/Sales_Forecast/',category:'매출 관리',description:'제품별 매출 흐름과 월 마감 전망을 확인하세요.',color:'blue',favorite:1,status:'진행 중',due:'',note:'',visited:0,revision:1,created:1},
{id:'sla',name:'SLA · DCM 관리',url:'https://yhbae106.github.io/SLA_DCM_2026_DW/',category:'유통 관리',description:'거래처 DCM 현황과 개선 활동을 확인하세요.',color:'teal',favorite:1,status:'진행 중',due:'',note:'',visited:0,revision:1,created:2},
{id:'gigo',name:'기고 수금내역서',url:'https://yhbae106.github.io/Gigo/',category:'수금 관리',description:'수금내역서를 작성하고 엑셀로 내려받으세요.',color:'purple',favorite:0,status:'진행 중',due:'',note:'',visited:0,revision:1,created:3},
{"id":"sla-assessment","name":"유통 협력사 SLA 평가","url":"https://topdoor.github.io/SLA-Assessment-System/","category":"유통 관리","description":"백제 · 복산 · 이지 · 인천 · 유진 · 아이팜의 SLA 평가를 확인하세요. 업체 계정으로 로그인이 필요합니다.","color":"teal","favorite":1,"status":"진행 중","due":"","note":"","visited":0,"revision":1,"created":4}
];
