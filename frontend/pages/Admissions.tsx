import type { GetServerSideProps } from "next"

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: "/#admissions",
    permanent: false,
  },
})

export default function AdmissionsRedirect() {
  return null
}
