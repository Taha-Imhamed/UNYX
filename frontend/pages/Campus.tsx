import type { GetServerSideProps } from "next"

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: "/#campus",
    permanent: false,
  },
})

export default function CampusRedirect() {
  return null
}
