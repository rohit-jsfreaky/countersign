// The sample's people and note (made up), shared by the app and scripts/sample.ts. The plan itself is real Terraform
// output: public/samples/plan.json, made from public/samples/main.tf (see the README).
export const SAMPLE_META = {
  project: "shop-infra · production",
  requestedBy: "Sam Okafor",
  reviewer: "Lena Brandt",
  link: "https://github.com/rohit-jsfreaky/countersign/blob/main/public/samples/main.tf",
  note: "Take a manual snapshot of shop-orders first, and confirm the exports bucket is archived. SSH from 0.0.0.0/0 is not approved: use the bastion range.",
};
