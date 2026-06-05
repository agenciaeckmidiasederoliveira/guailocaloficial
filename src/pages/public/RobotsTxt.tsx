import { gerarRobotsTxt } from '../../lib/seo'

export default function RobotsTxt() {
  return <pre className="whitespace-pre-wrap p-4 text-sm">{gerarRobotsTxt()}</pre>
}
