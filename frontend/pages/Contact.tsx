import type { GetServerSideProps } from "next"

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: "/#support",
    permanent: false,
  },
})

export default function ContactRedirect() {
  return null
}
