import packageInfo from '@/package.json'

const { license, name, version } = packageInfo

export const REPOSITORY = 'Halory-Ito/vnweb'
const repositoryUrl = `https://github.com/${REPOSITORY}`
const releasesUrl = `${repositoryUrl}/releases`

export const projectInfo = {
  name,
  version,
  build: process.env.NEXT_PUBLIC_VNWEB_DESKTOP_BUILD,
  releasesUrl,
  links: [
    { label: '开发者', text: 'Halory-Ito', href: 'https://github.com/Halory-Ito' },
    { label: '仓库地址', text: REPOSITORY, href: repositoryUrl },
    { label: '问题反馈', text: 'GitHub Issues', href: `${repositoryUrl}/issues/new` },
    { label: '使用文档', text: 'vnweb.pages.dev', href: 'https://vnweb.pages.dev/' },
    { label: '开源许可', text: license, href: `${repositoryUrl}/blob/main/LICENSE` },
  ],
}
