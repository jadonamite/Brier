"use client";
import Feature from "@/components/shadcn-space/blocks/feature-01/feature";
import { FileMagnifyingGlass, LockKey, Timer, SealCheck } from "@phosphor-icons/react/dist/ssr";

const featureData = [
  {
    icon: FileMagnifyingGlass,
    content:
      "Conformity is checked on chain: the document hash, then every condition in the order you wrote it \u2014 EQ, LTE or GTE, because \u201clatest shipment date on or before the 22nd\u201d is not an equality.",
  },
  {
    icon: LockKey,
    content:
      "Funded value leaves by two paths only \u2014 an honoured presentation, or a refund after expiry. No owner, no pause, no upgrade, no withdraw. Including for us.",
  },
  {
    icon: Timer,
    content:
      "Expiry is absolute. A conforming presentation one second late is refused and the applicant reclaims the full face amount. Anyone may trigger it; it can only ever pay the applicant.",
  },
  {
    icon: SealCheck,
    content:
      "A refusal is a record, not a revert. UCP 600 art. 16 requires each discrepancy to be stated \u2014 so the failed field, its bound, and what was presented are stored on chain.",
  },
];

const Feature01 = () => {
  return <Feature featureData={featureData} />;
};

export default Feature01;
