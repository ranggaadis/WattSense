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

const EnergySummaryEmail = ({
  name = "Customer",
  monthLabel = "Last Month",
  totalCost = "Rp 0",
  totalEnergy = "0 kWh",
  tips = ["Turn off idle devices", "Use LED lights", "Schedule heavy loads at night"],
}) => (
  <Html>
    <Head />
    <Tailwind config={tailwindConfig}>
      <Body className="bg-[#f3f3f5] font-sans">
        <Preview>Monthly energy summary and savings tips</Preview>
        <Container className="w-[680px] max-w-full mx-auto bg-white">
          <Section className="flex bg-[#f3f3f5] p-5 px-[30px]">
            <Img width={146} src={`${baseUrl}/logo.png`} alt="Logo" />
          </Section>

          <Section className="rounded-t-md flex flex-col bg-[#0c1b33]">
            <Row>
              <Column className="py-5 px-[30px] pb-[15px]">
                <Heading className="text-white text-[27px] leading-[30px] font-bold">
                  {monthLabel} Energy Summary
                </Heading>
                <Text className="text-white text-[16px] leading-[22px]">
                  Hi {name}, here is your usage snapshot and quick tips to save more energy.
                </Text>
              </Column>
              <Column className="py-[30px] px-[10px]">
                <Img
                  className="max-w-full"
                  width={200}
                  src={`${baseUrl}/static/energy-hero.png`}
                  alt="Energy usage"
                />
              </Column>
            </Row>
          </Section>

          <Section className="pt-[30px] px-[30px] pb-10">
            <Heading
              as="h2"
              className="mb-[10px] mt-0 font-bold text-[21px] leading-none text-[#0c0d0e]"
            >
              Your totals
            </Heading>
            <Text className="text-[15px] leading-[21px] text-[#3c3f44] mb-2">
              Cost: <strong>{totalCost}</strong>
            </Text>
            <Text className="text-[15px] leading-[21px] text-[#3c3f44]">
              Energy: <strong>{totalEnergy}</strong>
            </Text>

            <Hr className="my-[24px]" />

            <Heading
              as="h2"
              className="mb-[12px] font-bold text-[21px] leading-none text-[#0c0d0e]"
            >
              Quick tips to save more
            </Heading>
            <ul className="list-disc pl-5">
              {tips.map((tip, idx) => (
                <li key={idx} className="mb-2">
                  <Text className="text-[15px] leading-[21px] text-[#3c3f44]">
                    {tip}
                  </Text>
                </li>
              ))}
            </ul>
          </Section>
        </Container>

        <Section className="w-[680px] max-w-full mt-8 mx-auto py-0 px-[30px]">
          <Text className="text-xs leading-[15px] text-[#9199a1] m-0">
            You are receiving this email because you are subscribed to monthly energy summaries.
          </Text>

          <Link
            href="/"
            className="inline-block text-[#9199a1] underline text-[12px] mr-[10px] mb-0 mt-2"
          >
            Unsubscribe
          </Link>
          <Link
            href="/"
            className="inline-block text-[#9199a1] underline text-[12px] mr-[10px] mb-0 mt-2"
          >
            Edit email settings
          </Link>

          <Hr className="my-[24px] border-[#d6d8db]" />

          <Img width={111} src={`${baseUrl}/logo-sm.png`} alt="Logo small" />
          <Text className="my-1 text-[12px] leading-[15px] text-[#9199a1]">
            Energy Monitor Dashboard
          </Text>
        </Section>
      </Body>
    </Tailwind>
  </Html>
);

export default EnergySummaryEmail;
