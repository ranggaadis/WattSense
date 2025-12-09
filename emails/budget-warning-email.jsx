"use client";

import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import tailwindConfig from "../tailwind.config.mjs";

const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";

const BudgetWarningEmail = ({
  name = "Customer",
  percentUsed = 90,
  budgetLabel = "Budget",
  spentLabel = "Spent",
}) => (
  <Html>
    <Head />
    <Tailwind config={tailwindConfig}>
      <Body className="bg-[#fff7f5] font-sans">
        <Preview>Energy budget warning</Preview>
        <Container className="w-[680px] max-w-full mx-auto bg-white">
          <Section className="flex bg-[#fff7f5] p-5 px-[30px]">
            <Img width={146} src={`${baseUrl}/logo.png`} alt="Logo" />
          </Section>

          <Section className="rounded-t-md flex flex-col bg-[#7c2d12]">
            <Row>
              <Column className="py-5 px-[30px] pb-[15px]">
                <Heading className="text-white text-[27px] leading-[30px] font-bold">
                  Budget warning: {percentUsed.toFixed(1)}% used
                </Heading>
                <Text className="text-white text-[16px] leading-[22px]">
                  Hi {name}, your energy budget is almost fully used. Consider adding more kWh.
                </Text>
              </Column>
            </Row>
          </Section>

          <Section className="pt-[24px] px-[30px] pb-10">
            <Heading
              as="h2"
              className="mb-[10px] mt-0 font-bold text-[21px] leading-none text-[#0c0d0e]"
            >
              Current status
            </Heading>
            <Text className="text-[15px] leading-[21px] text-[#3c3f44] mb-2">
              {spentLabel} of {budgetLabel} used.
            </Text>
            <Text className="text-[15px] leading-[21px] text-[#3c3f44]">
              Add more kWh to avoid interruptions in tracking and alerts.
            </Text>

            <Section className="mt-6 block">
              <Link
                className="bg-[#7c2d12] border border-solid border-[#5c1f0c] text-[17px] leading-[17px] py-[13px] px-[17px] rounded max-w-[200px] text-white"
                href={`${baseUrl}/dashboard`}
              >
                Add more kWh
              </Link>
            </Section>
          </Section>
        </Container>

        <Section className="w-[680px] max-w-full mt-8 mx-auto py-0 px-[30px]">
          <Text className="text-xs leading-[15px] text-[#9199a1] m-0">
            You are receiving this warning because your energy budget usage crossed 90%.
          </Text>

          <Hr className="my-[24px] border-[#d6d8db]" />

          <Img width={111} src={`${baseUrl}/static/logo-sm.png`} alt="Logo small" />
          <Text className="my-1 text-[12px] leading-[15px] text-[#9199a1]">
            Energy Monitor Dashboard
          </Text>
        </Section>
      </Body>
    </Tailwind>
  </Html>
);

export default BudgetWarningEmail;
