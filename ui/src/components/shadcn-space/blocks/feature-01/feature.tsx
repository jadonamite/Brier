import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { Scales } from "@phosphor-icons/react/dist/ssr";
import { motion } from "motion/react";

type Features = {
  icon: PhosphorIcon;
  content: string;
}[];

const Feature = ({ featureData }: { featureData: Features }) => {
  return (
    <section id="how-it-works">
      <div className="py-16 md:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 md:gap-12">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.8,
                ease: [0.21, 0.47, 0.32, 0.98],
              }}
              className="flex flex-col items-center justify-center gap-4"
            >
              <div className="flex flex-col gap-4 max-w-full items-center text-center md:max-w-xl">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight">
                  Confidence in, truth out
                </h2>
                <p className="text-base font-normal text-muted-foreground">
                  Deploy the module, configure the semantic threshold, and let mathematics enforce honesty.
                  A prediction that correctly calibrates confidence is rewarded; one that overstates its certainty is heavily penalized on the record.
                </p>
              </div>
            </motion.div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.8,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="p-6 sm:p-16 rounded-2xl h-full w-full bg-[url('/instrument.svg')] bg-cover bg-center bg-no-repeat"
              >
                <Card className="flex items-start gap-12 has-data-[slot=card-footer]:pb-6! sm:has-data-[slot=card-footer]:pb-10! pt-6 sm:py-10 border-none shadow-none ring-0 rounded-lg">
                  <CardContent className="flex flex-col gap-6 px-6 sm:px-8">
                    <Avatar className="size-12">
                      <AvatarFallback className="bg-emerald-500/15 text-emerald-300">
                        <Scales size={22} weight="duotone" />
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl sm:text-2xl font-medium">
                      &ldquo;A scoring rule is strictly proper if and only if it gives the forecaster the maximum expected score when they state their true probability.&rdquo;
                    </h3>
                  </CardContent>
                  <CardFooter className="bg-card border-none w-full px-6 sm:px-8 py-0 flex flex-col items-start gap-0.5">
                    <p className="text-sm font-medium text-primary">
                      GLENN W. BRIER
                    </p>
                    <span className="text-xs font-normal text-muted-foreground uppercase">
                      VERIFICATION OF FORECASTS EXPRESSED IN TERMS OF PROBABILITY · 1950
                    </span>
                  </CardFooter>
                </Card>
              </motion.div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
                {featureData?.map((value, index) => {
                  return (
                    <motion.div
                      key={index}
                      initial={{ x: 100, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.8,
                        ease: [0.21, 0.47, 0.32, 0.98],
                      }}
                    >
                      <Card className="relative overflow-hidden py-8 bg-muted ring-0 border-0 h-full">
                        {/* The mark sits behind the words rather than above them —
                            it should register as texture, not as a bullet point. */}
                        <value.icon
                          aria-hidden
                          weight="duotone"
                          className="pointer-events-none absolute -bottom-6 -right-5 h-40 w-40 text-emerald-400/[0.07]"
                        />
                        <CardContent className="relative w-full h-full px-8 flex flex-col items-start justify-end">
                          <p className="text-base text-primary font-normal">
                            {value?.content}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Feature;
