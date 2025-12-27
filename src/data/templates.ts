import type { Template } from "../types";

// ==================== 알고리즘 템플릿 ====================
const algorithmTemplates: Template[] = [
  {
    id: "union-find",
    category: "algorithm",
    title: "유니온 파인드(Union-Find) 알고리즘",
    description: "원소들을 서로소 집합(서로 겹치지 않는 집합)으로 관리하는 자료구조 알고리즘",
    answer: `# 특정 원소가 속한 집합의 최상위 부모를 찾는 함수
def findSet(parents,a) :
  if parents[a] != a :
    parents[a] = findSet(parents,parents[a])
    return parents[a]

# 두 원소가 속한 집합 합치는 함수
def union(parents,a,b) :
  aRoot = findSet(parents, a)
  bRoot = findSet(parents, b)
  if aRoot < bRoot :
    parents[bRoot] = aRoot
  else:
    parents[aRoot] = bRoot

# 노드의 개수와 간선(Union 연산)의 개수 입력 받기
v, e = map(int, input().split())
parents = [0] * (v + 1) # 부모 테이블 초기화하기

# 부모를 자기 자신으로 초기화
for i in range(1, v + 1):
  parents[i] = i

# Union 연산을 각각 수행
for i in range(e):
  a, b = map(int, input().split())
  union(parents, a, b)

# 각 원소가 속한 집합 출력하기
print('각 원소가 속한 집합: ', end='')
for i in range(1, v + 1):
  print(findSet(i), end=' ')

print()

# 부모 테이블 내용 출력하기
print('부모 테이블: ', end='')
for i in range(1, v + 1):
  print(parents[i], end=' ')`,
  },

  {
    id: "kruskal",
    category: "algorithm",
    title: "크루스칼 (Kruskal) 알고리즘",
    description: "최소 신장 트리(MST: Minimum Spanning Tree)를 찾는 알고리즘",
    answer: `# 특정 원소가 속한 집합의 최상위 부모를 찾는 함수
def findSet(parents,a) :
  if parents[a] != a :
    parents[a] = findSet(parents,parents[a])
    return parents[a]

# 두 원소가 속한 집합 합치는 함수
def union(parents,a,b) :
  aRoot = findSet(parents, a)
  bRoot = findSet(parents, b)
  if aRoot < bRoot :
    parents[bRoot] = aRoot
  else:
    parents[aRoot] = bRoot


v, e = map(int, input().split())  # 노드, 간선 수
parents = [0] * (v + 1)
edges = []    # 간선 정보 담을 리스트
result = 0    # 최소 신장 트리 계산 변수

# 자기 자신을 부모로 초기화
for i in range(1, v+1) :
  parents[i] = i

# 간선을 입력받아 cost를 기준으로 오름차순
for _ in range(e) :
  a,b,cost = map(int, input().split())
  edges.append((a, b, cost))
edges.sort(key=lambda x : x[2])

# 정렬된 간선을 하나씩 확인
for edge in edges :
  a, b, cost = edge
  # 두 노드의 루트 노드가 서로 다르다면 사이클이 발생하지 않은 것
  if findSet(parents,a) != findSet(parents,b) :
    # 신장 트리에 간선 추가
    union(parents,a,b)
    result += cost

print(result)`,
  },

  {
    id: "dijkstra",
    category: "algorithm",
    title: "다익스트라 (Dijkstra) 알고리즘",
    description: "최단 경로를 찾는 알고리즘",
    answer: `import sys
from heapq import heapify, heappush, heappop

input = sys.stdin.readline
INF = int(1e9)

v, e = map(int, input().split())  # 정점 수, 간선 수
k = int(input())  # 시작 정점

graph = [[] for _ in range(v + 1)]

# 간선 정보 입력
for _ in range(e):
    start, end, weight = map(int, input().split())
    graph[start].append((weight, end))  # start → end 간선, 가중치 weight

# 거리 배열 초기화
distance = [INF] * (v + 1)

def dijkstra(start):
    pq = [(0, start)]  # 우선순위 큐 초기화: (거리, 노드) 형태
    distance[start] = 0  # 시작 노드까지의 거리는 0으로 설정

    while pq:
        cur_dist, cur_node = heappop(pq)  # 현재까지 가장 짧은 거리의 노드를 꺼냄

        # 이미 더 짧은 거리로 방문한 적이 있다면 스킵
        if distance[cur_node] < cur_dist:
            continue

        # 현재 노드와 인접한 모든 노드 확인
        for nex_distance, nex_node in graph[cur_node]:
            new_dist = cur_dist + nex_distance # 현재 거리 + 간선 가중치 = 새 거리

            # 더 짧은 경로를 찾은 경우 갱신
            if new_dist < distance[nex_node]:
                distance[nex_node] = new_dist  # 최단 거리 배열 업데이트
                heappush(pq, (new_dist, nex_node))  # 갱신된 거리와 노드를 큐에 추가


# 알고리즘 실행
dijkstra(k)

# 결과 출력
for i in range(1, v + 1):
    print(distance[i] if distance[i] != INF else 'INF')`,
  },

  {
    id: "topological sort",
    category: "algorithm",
    title: "위상 정렬 (Topological Sort) 알고리즘",
    description: "방향 그래프에서 노드 간의 순서(선행 관계)를 정하는 알고리즘",
    answer: `from collections import deque

# 정점의 수 n, 간선의 수 m 입력
n, m = map(int, input().split())

visited = []  # 위상 정렬 결과를 저장할 리스트
graph = [[] for _ in range(n + 1)]

# 각 정점의 진입 차수(Indegree)를 저장할 리스트
indegree = [0] * (n + 1)

# 간선 정보 입력
for _ in range(m):
    v, u = map(int, input().split())  # v -> u (v에서 u로 향하는 간선)
    graph[v].append(u)        # v에 연결된 노드 목록에 u 추가
    indegree[u] += 1          # u의 진입 차수 1 증가

q = deque()  # 진입 차수가 0인 정점을 담을 큐

# 처음 시작할 때 진입 차수가 0인 정점을 큐에 넣음
for v in range(1, n + 1):
    if indegree[v] == 0:
        q.append(v)

# 위상 정렬 수행 (BFS 기반)
while q:
    cur = q.popleft()         # 큐에서 정점 꺼냄
    visited.append(cur)       # 정렬 결과에 추가

    # 현재 정점과 연결된 다음 정점들의 진입 차수 감소
    for nex in graph[cur]:
        indegree[nex] -= 1    # 진입 차수 1 감소
        if indegree[nex] == 0:
            q.append(nex)     # 진입 차수가 0이 되면 큐에 추가

print(*visited)`,
  },
];

// ==================== CS 템플릿 ====================
const csTemplates: Template[] = [
  {
    id: "oop-principles",
    category: "cs",
    title: "OOP 4대 원칙",
    description: "객체지향 프로그래밍의 핵심 원칙",
    answer: `1. 캡슐화 (Encapsulation)
   - 데이터와 메서드를 하나로 묶음
   - 외부 접근 제한

2. 상속 (Inheritance)
   - 기존 클래스의 속성과 메서드를 물려받음
   - 코드 재사용성 향상

3. 다형성 (Polymorphism)
   - 같은 이름의 메서드가 다른 동작 수행
   - 오버로딩, 오버라이딩

4. 추상화 (Abstraction)
   - 복잡한 세부사항 숨김
   - 필요한 기능만 노출`,
  },
];

// ==================== 영어 템플릿 ====================
const englishTemplates: Template[] = [
  {
    id: "hello-world",
    category: "english",
    title: "Hello World",
    description: "영어 인사 표현",
    answer: `Hello, World!
How are you?
I'm fine, thank you.`,
  },
];

// ==================== 면접 템플릿 ====================
const interviewTemplates: Template[] = [
  {
    id: "interview-intro",
    category: "interview",
    title: "자기소개",
    description: "면접 자기소개 템플릿",
    answer: `안녕하십니까. 저는 [이름]입니다.
저는 [경력/경험]을 통해 [역량]을 키워왔습니다.

특히 [프로젝트/경험]에서 [성과]를 달성했으며,
이를 통해 [배운 점/성장한 점]을 얻었습니다.

귀사에서 [기여하고 싶은 점]을 통해
함께 성장하고 싶습니다. 감사합니다.`,
  },
];

// ==================== 전체 템플릿 통합 ====================
export const templates: Template[] = [
  ...algorithmTemplates,
  ...csTemplates,
  ...englishTemplates,
  ...interviewTemplates,
];

/**
 * 카테고리별로 템플릿을 가져오는 함수
 */
export function getTemplatesByCategory(category: string): Template[] {
  return templates.filter((template) => template.category === category);
}

/**
 * ID로 템플릿을 가져오는 함수
 */
export function getTemplateById(id: string): Template | undefined {
  return templates.find((template) => template.id === id);
}
