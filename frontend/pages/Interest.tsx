import type { GetServerSideProps } from "next"

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: "/#scholarships",
    permanent: false,
  },
})

export default function InterestRedirect() {
  return null
}
