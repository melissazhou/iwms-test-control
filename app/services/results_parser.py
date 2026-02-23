import json
import os


def parse_playwright_results(project_root: str):
    fp = os.path.join(project_root, 'test-results', 'results.json')
    if not os.path.exists(fp):
        return None

    try:
      with open(fp, 'r', encoding='utf-8') as f:
          raw = json.load(f)
    except Exception:
      return None

    stats = raw.get('stats', {})
    summary = {
        'total': stats.get('expected'),
        'unexpected': stats.get('unexpected', 0),
        'skipped': stats.get('skipped', 0),
        'durationMs': stats.get('duration'),
        'failed': []
    }

    def walk_suite(suite):
        for spec in suite.get('specs', []):
            title = spec.get('title', '')
            file = spec.get('file', '')
            for t in spec.get('tests', []):
                for r in t.get('results', []):
                    if r.get('status') in ('failed', 'timedOut', 'interrupted'):
                        summary['failed'].append({
                            'file': file,
                            'title': title,
                            'project': t.get('projectName'),
                            'status': r.get('status')
                        })
                        break
        for c in suite.get('suites', []):
            walk_suite(c)

    for s in raw.get('suites', []):
        walk_suite(s)

    return summary
