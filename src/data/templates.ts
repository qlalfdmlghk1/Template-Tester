import type { Template } from '../types';

export const templates: Template[] = [
  {
    id: 'dijkstra',
    category: 'algorithm',
    title: '다익스트라 (Dijkstra) 알고리즘',
    description: '최단 경로를 찾는 알고리즘',
    answer: `import heapq
import sys

def dijkstra(start, graph, n):
    # 거리 테이블 초기화
    distance = [sys.maxsize] * (n + 1)
    distance[start] = 0

    # 우선순위 큐 초기화
    pq = []
    heapq.heappush(pq, (0, start))

    while pq:
        # 현재 최단 거리 노드 꺼내기
        dist, now = heapq.heappop(pq)

        # 이미 처리된 노드라면 무시
        if distance[now] < dist:
            continue

        # 인접한 노드들을 확인
        for next_node, weight in graph[now]:
            cost = dist + weight

            # 현재 노드를 거쳐서 가는 것이 더 짧은 경우
            if cost < distance[next_node]:
                distance[next_node] = cost
                heapq.heappush(pq, (cost, next_node))

    return distance

# 사용 예시
n = 6  # 노드 개수
graph = [[] for _ in range(n + 1)]

# 간선 정보 입력 (양방향)
edges = [
    (1, 2, 2),
    (1, 3, 5),
    (1, 4, 1),
    (2, 3, 3),
    (2, 4, 2),
    (3, 2, 3),
    (3, 6, 5),
    (4, 3, 3),
    (4, 5, 1),
    (5, 3, 1),
    (5, 6, 2),
]

for a, b, w in edges:
    graph[a].append((b, w))

# 1번 노드에서 시작
result = dijkstra(1, graph, n)
print(result)`,
  },
  {
    id: 'binary-search',
    category: 'algorithm',
    title: '이진 탐색 (Binary Search)',
    description: '정렬된 배열에서 특정 값을 빠르게 찾는 알고리즘',
    answer: `def binary_search(arr, target):
    left = 0
    right = len(arr) - 1

    while left <= right:
        mid = (left + right) // 2

        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return -1

# 사용 예시
arr = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19]
target = 7
result = binary_search(arr, target)
print(f"Index: {result}")`,
  },
  {
    id: 'hello-world',
    category: 'english',
    title: 'Hello World',
    description: '영어 인사 표현',
    answer: `Hello, World!
How are you?
I'm fine, thank you.`,
  },
  {
    id: 'oop-principles',
    category: 'cs',
    title: 'OOP 4대 원칙',
    description: '객체지향 프로그래밍의 핵심 원칙',
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
  {
    id: 'interview-intro',
    category: 'interview',
    title: '자기소개',
    description: '면접 자기소개 템플릿',
    answer: `안녕하십니까. 저는 [이름]입니다.
저는 [경력/경험]을 통해 [역량]을 키워왔습니다.

특히 [프로젝트/경험]에서 [성과]를 달성했으며,
이를 통해 [배운 점/성장한 점]을 얻었습니다.

귀사에서 [기여하고 싶은 점]을 통해
함께 성장하고 싶습니다. 감사합니다.`,
  },
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
